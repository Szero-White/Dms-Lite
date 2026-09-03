package com.example.dms.payment;

import com.example.dms.audit.AuditService;
import com.example.dms.common.BusinessException;
import com.example.dms.common.TenantContext;
import com.example.dms.customer.CustomerRepository;
import com.example.dms.debt.CustomerDebtRepository;
import com.example.dms.debt.CustomerDebtTransaction;
import com.example.dms.sales.SalesOrder;
import com.example.dms.sales.SalesOrderRepository;
import java.math.BigDecimal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private static final String DEBT_DIRECTION_DECREASE = "DECREASE";
    private static final String SOURCE_TYPE_PAYMENT = "PAYMENT";
    private static final String SOURCE_TYPE_SALES_ORDER = "SALES_ORDER";
    private static final String AUDIT_ACTION_PAYMENT_RECORDED = "PAYMENT_RECORDED";

    private final PaymentRepository paymentRepository;
    private final CustomerRepository customerRepository;
    private final CustomerDebtRepository customerDebtRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final AuditService auditService;

    @Transactional
    @CacheEvict(
        value = "dashboard",
        key = "T(com.example.dms.common.TenantContext).tenantRequired()"
    )
    public PaymentResponse recordCustomerPayment(CustomerPaymentRequest request) {
        Long tenantId = TenantContext.tenantRequired();
        validateCustomerExists(request.customerId(), tenantId);

        List<CustomerDebtTransaction> openReceivables = customerDebtRepository.lockOpenReceivables(
            tenantId,
            request.customerId()
        );
        BigDecimal debtBalance = openReceivables.stream()
            .map(CustomerDebtTransaction::getRemainingAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (request.amount().compareTo(debtBalance) > 0) {
            throw new BusinessException("Payment exceeds debt");
        }

        applyPaymentToOpenReceivables(openReceivables, request.amount(), tenantId);

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
            AUDIT_ACTION_PAYMENT_RECORDED,
            "Payment",
            savedPayment.getId(),
            request.amount().toPlainString()
        );

        return PaymentResponse.from(savedPayment);
    }

    private void applyPaymentToOpenReceivables(
        List<CustomerDebtTransaction> openReceivables,
        BigDecimal paymentAmount,
        Long tenantId
    ) {
        BigDecimal remainingPaymentAmount = paymentAmount;

        for (CustomerDebtTransaction debtTransaction : openReceivables) {
            if (remainingPaymentAmount.signum() <= 0) {
                return;
            }

            BigDecimal appliedAmount = remainingPaymentAmount.min(debtTransaction.getRemainingAmount());
            debtTransaction.setRemainingAmount(debtTransaction.getRemainingAmount().subtract(appliedAmount));
            synchronizeSalesOrderAmounts(debtTransaction, appliedAmount, tenantId);
            remainingPaymentAmount = remainingPaymentAmount.subtract(appliedAmount);
        }
    }

    private void synchronizeSalesOrderAmounts(
        CustomerDebtTransaction debtTransaction,
        BigDecimal appliedAmount,
        Long tenantId
    ) {
        if (
            !SOURCE_TYPE_SALES_ORDER.equals(debtTransaction.getSourceType())
                || debtTransaction.getSourceId() == null
        ) {
            return;
        }

        SalesOrder salesOrder = salesOrderRepository.findByIdAndTenantId(
                debtTransaction.getSourceId(),
                tenantId
            )
            .orElseThrow(() -> new BusinessException("Sales order for receivable not found"));

        BigDecimal remainingDebt = debtTransaction.getRemainingAmount();

        BigDecimal synchronizedPaidAmount = salesOrder.getTotalAmount() == null
            ? (salesOrder.getPaidAmount() == null
                ? BigDecimal.ZERO
                : salesOrder.getPaidAmount()).add(appliedAmount)
            : salesOrder.getTotalAmount().subtract(remainingDebt);

        salesOrder.setPaidAmount(synchronizedPaidAmount);
        salesOrder.setDebtAmount(remainingDebt);
    }

    private void validateCustomerExists(Long customerId, Long tenantId) {
        customerRepository.findByIdAndTenantIdAndDeletedAtIsNull(customerId, tenantId)
            .orElseThrow(() -> new BusinessException("Customer not found"));
    }
}
