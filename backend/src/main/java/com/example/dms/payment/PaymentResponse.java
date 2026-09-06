package com.example.dms.payment;

import java.math.BigDecimal;
import java.time.Instant;

public record PaymentResponse(
    Long id,
    String code,
    Long customerId,
    BigDecimal amount,
    String note,
    Instant createdAt
) {

    public static PaymentResponse from(Payment payment) {
        return new PaymentResponse(
            payment.getId(),
            payment.getCode(),
            payment.getCustomerId(),
            payment.getAmount(),
            payment.getNote(),
            payment.getCreatedAt()
        );
    }
}
