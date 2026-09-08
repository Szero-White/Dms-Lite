package com.example.dms.payment;

import java.math.BigDecimal;
import java.time.Instant;

public record PaymentResponse(
    Long id,
    String code,
    Long customerId,
    String customerName,
    Long salesOrderId,
    String salesOrderCode,
    BigDecimal salesOrderTotal,
    BigDecimal amount,
    BigDecimal debtBefore,
    BigDecimal debtAfter,
    String note,
    String recordedBy,
    Instant createdAt,
    boolean legacy
) {

    public static PaymentResponse from(Payment payment) {
        return new PaymentResponse(
            payment.getId(),
            payment.getCode(),
            payment.getCustomerId(),
            payment.getCustomerNameSnapshot(),
            payment.getSalesOrderId(),
            payment.getSalesOrderCodeSnapshot(),
            payment.getSalesOrderTotalSnapshot(),
            payment.getAmount(),
            payment.getDebtBefore(),
            payment.getDebtAfter(),
            payment.getNote(),
            payment.getRecordedBySnapshot(),
            payment.getCreatedAt(),
            payment.getSalesOrderId() == null
        );
    }
}
