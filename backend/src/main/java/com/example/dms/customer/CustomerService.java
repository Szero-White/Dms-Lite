package com.example.dms.customer;

import com.example.dms.audit.AuditService;
import com.example.dms.common.BusinessException;
import com.example.dms.common.TenantContext;
import com.example.dms.debt.CustomerDebtRepository;
import com.example.dms.debt.CustomerDebtTransaction;
import java.math.BigDecimal;
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
                .name(request.name())
                .phone(request.phone())
                .address(request.address())
                .creditLimit(request.creditLimit() == null ? BigDecimal.ZERO : request.creditLimit())
                .paymentTermDays(request.paymentTermDays() == null ? 14 : request.paymentTermDays())
                .active(true)
                .build()
        );

        auditService.log(
            "CUSTOMER_CREATED",
            "Customer",
            savedCustomer.getId(),
            savedCustomer.getName()
        );
        return savedCustomer;
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
}
