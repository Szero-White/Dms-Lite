package com.example.dms.customer;

import com.example.dms.audit.AuditService;
import com.example.dms.common.BusinessException;
import com.example.dms.common.TenantContext;
import com.example.dms.debt.CustomerDebtRepository;
import com.example.dms.debt.CustomerDebtTransaction;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private static final int DEFAULT_PAGE_SIZE = 20;

    private final CustomerRepository customerRepository;
    private final CustomerDebtRepository customerDebtRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<CustomerResponse> list(String keyword, int page) {
        Long tenantId = TenantContext.tenantRequired();
        Page<Customer> customers = customerRepository.findByTenantIdAndDeletedAtIsNullAndNameContainingIgnoreCase(
            tenantId,
            keyword,
            PageRequest.of(Math.max(page, 0), DEFAULT_PAGE_SIZE)
        );

        Map<Long, BigDecimal> debtByCustomerId = loadDebtBalances(tenantId, customers.getContent());
        return customers.map(customer -> toResponse(
            customer,
            debtByCustomerId.getOrDefault(customer.getId(), BigDecimal.ZERO)
        ));
    }

    @Transactional(readOnly = true)
    public CustomerResponse get(Long customerId) {
        Long tenantId = TenantContext.tenantRequired();
        Customer customer = find(customerId);
        return toResponse(customer, customerDebtRepository.balance(tenantId, customerId));
    }

    @Transactional
    @CacheEvict(
        value = "dashboard",
        key = "T(com.example.dms.common.TenantContext).tenantRequired()"
    )
    public Customer create(CustomerRequest request) {
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
        return savedCustomer;
    }

    @Transactional
    @CacheEvict(
        value = "dashboard",
        key = "T(com.example.dms.common.TenantContext).tenantRequired()"
    )
    public Customer update(Long customerId, CustomerRequest request) {
        Customer customer = find(customerId);
        applyCustomerRequest(customer, request);

        auditService.log(
            "CUSTOMER_UPDATED",
            "Customer",
            customer.getId(),
            customer.getName()
        );
        return customer;
    }

    @Transactional
    @CacheEvict(
        value = "dashboard",
        key = "T(com.example.dms.common.TenantContext).tenantRequired()"
    )
    public void delete(Long customerId) {
        Customer customer = find(customerId);
        BigDecimal debtBalance = customerDebtRepository.balance(
            TenantContext.tenantRequired(),
            customer.getId()
        );

        if (debtBalance.signum() > 0) {
            throw new BusinessException("Cannot delete customer with outstanding debt");
        }

        customer.setActive(false);
        customer.setDeletedAt(Instant.now());

        auditService.log(
            "CUSTOMER_DELETED",
            "Customer",
            customer.getId(),
            customer.getName()
        );
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
