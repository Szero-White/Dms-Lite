package com.example.dms.payment;

import java.math.BigDecimal;
import java.time.Instant;

public record PaymentReceiptResponse(
    Long paymentId,
    String paymentCode,
    String companyName,
    Long customerId,
    String customerName,
    String customerPhone,
    String customerAddress,
    Long salesOrderId,
    String salesOrderCode,
    BigDecimal salesOrderTotal,
    BigDecimal debtBefore,
    BigDecimal amountReceived,
    BigDecimal debtAfter,
    String note,
    String recordedBy,
    Instant receivedAt,
    boolean legacy
) {

    public static PaymentReceiptResponse from(Payment payment) {
        return new PaymentReceiptResponse(
            payment.getId(),
            payment.getCode(),
            payment.getCompanyNameSnapshot(),
            payment.getCustomerId(),
            payment.getCustomerNameSnapshot(),
            payment.getCustomerPhoneSnapshot(),
            payment.getCustomerAddressSnapshot(),
            payment.getSalesOrderId(),
            payment.getSalesOrderCodeSnapshot(),
            payment.getSalesOrderTotalSnapshot(),
            payment.getDebtBefore(),
            payment.getAmount(),
            payment.getDebtAfter(),
            payment.getNote(),
            payment.getRecordedBySnapshot(),
            payment.getCreatedAt(),
            payment.getSalesOrderId() == null
        );
    }
}
