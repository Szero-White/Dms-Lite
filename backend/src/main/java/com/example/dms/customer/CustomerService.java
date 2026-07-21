package com.example.dms.customer;

import com.example.dms.audit.AuditService;
import com.example.dms.common.BusinessException;
import com.example.dms.common.TenantContext;
import com.example.dms.debt.CustomerDebtRepository;
import com.example.dms.debt.CustomerDebtTransaction;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;

    private final CustomerDebtRepository customerDebtRepository;

    private final AuditService auditService;

    public Page<CustomerResponse> list(String keyword, int page) {
        Long tenantId = TenantContext.tenantRequired();
        return customerRepository.findByTenantIdAndDeletedAtIsNullAndNameContainingIgnoreCase(
            tenantId,
            keyword,
            PageRequest.of(page, 20)
        ).map(customer -> new CustomerResponse(
            customer.getId(),
            customer.getName(),
            customer.getPhone(),
            customer.getAddress(),
            customer.getCreditLimit(),
            customer.getPaymentTermDays(),
            customerDebtRepository.balance(tenantId, customer.getId()),
            customer.isActive()
        ));
    }

    @Transactional
    public Customer create(CustomerRequest request) {
        Customer savedCustomer = customerRepository.save(
            Customer.builder()
                .tenantId(TenantContext.tenantRequired())
                .active(true)
                .build()
        );
        applyCustomerRequest(savedCustomer, request);

        auditService.log(
            "CUSTOMER_CREATED",
            "Customer",
            savedCustomer.getId(),
            savedCustomer.getName()
        );
        return savedCustomer;
    }

    @Transactional
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

    public List<CustomerDebtTransaction> statement(Long customerId) {
        return customerDebtRepository.findByTenantIdAndCustomerIdOrderByCreatedAtDesc(
            TenantContext.tenantRequired(),
            customerId
        );
    }

    public Customer find(Long customerId) {
        return customerRepository.findByIdAndTenantIdAndDeletedAtIsNull(
            customerId,
            TenantContext.tenantRequired()
        ).orElseThrow(() -> new BusinessException("Customer not found"));
    }

    private void applyCustomerRequest(Customer customer, CustomerRequest request) {
        customer.setName(request.name());
        customer.setPhone(request.phone());
        customer.setAddress(request.address());
        customer.setCreditLimit(
            request.creditLimit() == null ? BigDecimal.ZERO : request.creditLimit()
        );
        customer.setPaymentTermDays(
            request.paymentTermDays() == null ? 14 : request.paymentTermDays()
        );
    }
}
