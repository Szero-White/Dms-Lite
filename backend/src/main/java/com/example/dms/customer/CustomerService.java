package com.example.dms.customer;

import com.example.dms.audit.AuditService;
import com.example.dms.common.BusinessException;
import com.example.dms.common.TenantContext;
import com.example.dms.debt.CustomerDebtRepository;
import com.example.dms.debt.CustomerDebtTransaction;
import com.example.dms.sales.SalesOrderRepository;
import com.example.dms.sales.SalesOrderStatus;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private static final int DEFAULT_PAGE_SIZE = 20;

    private final CustomerRepository customerRepository;
    private final CustomerDebtRepository customerDebtRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<CustomerResponse> list(String keyword, int page) {
        Long tenantId = TenantContext.tenantRequired();
        Page<Customer> customers = customerRepository.findByTenantIdAndDeletedAtIsNullAndNameContainingIgnoreCase(
            tenantId,
            keyword,
            PageRequest.of(
                Math.max(page, 0),
                DEFAULT_PAGE_SIZE,
                Sort.by(Sort.Order.desc("active"), Sort.Order.asc("name"))
            )
        );

        boolean includeDebtBalance = canViewDebtBalance();
        Map<Long, BigDecimal> debtByCustomerId = includeDebtBalance
            ? loadDebtBalances(tenantId, customers.getContent())
            : Map.of();

        return customers.map(customer -> toResponse(
            customer,
            includeDebtBalance
                ? debtByCustomerId.getOrDefault(customer.getId(), BigDecimal.ZERO)
                : null
        ));
    }

    @Transactional(readOnly = true)
    public CustomerResponse get(Long customerId) {
        Long tenantId = TenantContext.tenantRequired();
        Customer customer = find(customerId);
        BigDecimal debtBalance = canViewDebtBalance()
            ? customerDebtRepository.balance(tenantId, customerId)
            : null;
        return toResponse(customer, debtBalance);
    }

    @Transactional
    @CacheEvict(
        value = "dashboard",
        key = "T(com.example.dms.common.TenantContext).tenantRequired()"
    )
    public CustomerResponse create(CustomerRequest request) {
        Customer customer = Customer.builder()
            .tenantId(TenantContext.tenantRequired())
            .active(true)
            .build();
        applyCustomerRequest(customer, request);
        Customer savedCustomer = customerRepository.save(customer);

        auditService.log(
            "CUSTOMER_CREATED",
            "Customer",
            savedCustomer.getId(),
            savedCustomer.getName()
        );
        return toResponse(
            savedCustomer,
            canViewDebtBalance() ? BigDecimal.ZERO : null
        );
    }

    @Transactional
    @CacheEvict(
        value = "dashboard",
        key = "T(com.example.dms.common.TenantContext).tenantRequired()"
    )
    public CustomerResponse update(Long customerId, CustomerRequest request) {
        Customer customer = find(customerId);
        applyCustomerRequest(customer, request);

        auditService.log(
            "CUSTOMER_UPDATED",
            "Customer",
            customer.getId(),
            customer.getName()
        );
        BigDecimal debtBalance = canViewDebtBalance()
            ? customerDebtRepository.balance(TenantContext.tenantRequired(), customerId)
            : null;
        return toResponse(customer, debtBalance);
    }

    @Transactional
    @CacheEvict(
        value = "dashboard",
        key = "T(com.example.dms.common.TenantContext).tenantRequired()"
    )
    public CustomerResponse deactivate(Long customerId) {
        Long tenantId = TenantContext.tenantRequired();
        Customer customer = lock(customerId, tenantId);

        if (!customer.isActive()) {
            return toResponse(
                customer,
                canViewDebtBalance() ? customerDebtRepository.balance(tenantId, customerId) : null
            );
        }

        BigDecimal debtBalance = customerDebtRepository.balance(tenantId, customer.getId());
        if (debtBalance.signum() > 0) {
            throw new BusinessException("Cannot deactivate customer with outstanding debt");
        }

        if (salesOrderRepository.existsByTenantIdAndCustomerIdAndStatus(
            tenantId,
            customer.getId(),
            SalesOrderStatus.DRAFT
        )) {
            throw new BusinessException("Cannot deactivate customer with draft sales orders");
        }

        customer.setActive(false);
        auditService.log(
            "CUSTOMER_DEACTIVATED",
            "Customer",
            customer.getId(),
            customer.getName()
        );

        return toResponse(customer, canViewDebtBalance() ? debtBalance : null);
    }

    @Transactional
    @CacheEvict(
        value = "dashboard",
        key = "T(com.example.dms.common.TenantContext).tenantRequired()"
    )
    public CustomerResponse reactivate(Long customerId) {
        Long tenantId = TenantContext.tenantRequired();
        Customer customer = lock(customerId, tenantId);

        if (!customer.isActive()) {
            customer.setActive(true);
            auditService.log(
                "CUSTOMER_REACTIVATED",
                "Customer",
                customer.getId(),
                customer.getName()
            );
        }

        BigDecimal debtBalance = canViewDebtBalance()
            ? customerDebtRepository.balance(tenantId, customerId)
            : null;
        return toResponse(customer, debtBalance);
    }

    @Transactional(readOnly = true)
    public List<CustomerDebtTransaction> statement(Long customerId) {
        find(customerId);
        return customerDebtRepository.findByTenantIdAndCustomerIdOrderByCreatedAtDesc(
            TenantContext.tenantRequired(),
            customerId
        );
    }

    @Transactional(readOnly = true)
    public Customer find(Long customerId) {
        return customerRepository.findByIdAndTenantIdAndDeletedAtIsNull(
            customerId,
            TenantContext.tenantRequired()
        ).orElseThrow(() -> new BusinessException("Customer not found"));
    }

    private Customer lock(Long customerId, Long tenantId) {
        return customerRepository.lockByIdAndTenantIdAndDeletedAtIsNull(customerId, tenantId)
            .orElseThrow(() -> new BusinessException("Customer not found"));
    }

    private boolean canViewDebtBalance() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        return authentication != null && CustomerAccessPolicy.canViewBalance(
            authentication.getAuthorities().stream().map(authority -> authority.getAuthority()).toList()
        );
    }

    private Map<Long, BigDecimal> loadDebtBalances(Long tenantId, List<Customer> customers) {
        if (customers.isEmpty()) {
            return Map.of();
        }

        List<Long> customerIds = customers.stream().map(Customer::getId).toList();
        Map<Long, BigDecimal> balances = new HashMap<>();
        customerDebtRepository.balancesForCustomers(tenantId, customerIds)
            .forEach(view -> balances.put(view.getCustomerId(), view.getBalance()));
        return balances;
    }

    private CustomerResponse toResponse(Customer customer, BigDecimal debtBalance) {
        return new CustomerResponse(
            customer.getId(),
            customer.getName(),
            customer.getPhone(),
            customer.getAddress(),
            customer.getCreditLimit(),
            customer.getPaymentTermDays(),
            debtBalance,
            customer.isActive()
        );
    }

    private void applyCustomerRequest(Customer customer, CustomerRequest request) {
        customer.setName(request.name());
        customer.setPhone(request.phone());
        customer.setAddress(request.address());
        customer.setCreditLimit(
            request.creditLimit() == null ? BigDecimal.ZERO : request.creditLimit()
        );
        customer.setPaymentTermDays(
            request.paymentTermDays() == null ? 0 : request.paymentTermDays()
        );
    }
}
