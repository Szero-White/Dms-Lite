package com.example.dms.payment;

import com.example.dms.audit.AuditService;
import com.example.dms.common.BusinessException;
import com.example.dms.common.TenantContext;
import com.example.dms.customer.CustomerRepository;
import com.example.dms.debt.CustomerDebtRepository;
import com.example.dms.debt.CustomerDebtTransaction;
import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private static final String DEBT_DIRECTION_INCREASE = "INCREASE";
    private static final String DEBT_DIRECTION_DECREASE = "DECREASE";
    private static final String SOURCE_TYPE_PAYMENT = "PAYMENT";

    private final PaymentRepository paymentRepository;
    private final CustomerRepository customerRepository;
    private final CustomerDebtRepository customerDebtRepository;
    private final AuditService auditService;

    @Transactional
    @CacheEvict(value = "dashboard", allEntries = true)
    public PaymentResponse recordCustomerPayment(CustomerPaymentRequest request) {
        Long tenantId = TenantContext.tenantRequired();
        validateCustomerExists(request.customerId(), tenantId);

        BigDecimal debtBalance = customerDebtRepository.balance(tenantId, request.customerId());
        if (request.amount().compareTo(debtBalance) > 0) {
            throw new BusinessException("Payment exceeds debt");
        }

        BigDecimal remainingPaymentAmount = request.amount();
        for (CustomerDebtTransaction debtTransaction :
            customerDebtRepository
                .findByTenantIdAndCustomerIdAndDirectionAndRemainingAmountGreaterThanOrderByDueDateAscCreatedAtAsc(
                    tenantId,
                    request.customerId(),
                    DEBT_DIRECTION_INCREASE,
                    BigDecimal.ZERO
                )) {
            if (remainingPaymentAmount.signum() <= 0) {
                break;
            }

            BigDecimal appliedAmount = remainingPaymentAmount.min(debtTransaction.getRemainingAmount());
            debtTransaction.setRemainingAmount(debtTransaction.getRemainingAmount().subtract(appliedAmount));
            remainingPaymentAmount = remainingPaymentAmount.subtract(appliedAmount);
        }

        Payment savedPayment = paymentRepository.save(
            Payment.builder()
                .tenantId(tenantId)
                .customerId(request.customerId())
                .amount(request.amount())
                .note(request.note())
                .createdBy(TenantContext.userOrZero())
                .build()
        );

        customerDebtRepository.save(
            CustomerDebtTransaction.builder()
                .tenantId(tenantId)
                .customerId(request.customerId())
                .sourceType(SOURCE_TYPE_PAYMENT)
                .sourceId(savedPayment.getId())
                .direction(DEBT_DIRECTION_DECREASE)
                .amount(request.amount())
                .remainingAmount(BigDecimal.ZERO)
                .note(request.note())
                .createdBy(TenantContext.userOrZero())
                .build()
        );

        auditService.log(
            "CUSTOMER_PAYMENT_RECORDED",
            "Payment",
            savedPayment.getId(),
            request.amount().toPlainString()
        );

        return PaymentResponse.from(savedPayment);
    }

    private void validateCustomerExists(Long customerId, Long tenantId) {
        customerRepository.findByIdAndTenantIdAndDeletedAtIsNull(customerId, tenantId)
            .orElseThrow(() -> new BusinessException("Customer not found"));
    }
}
