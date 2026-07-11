package com.example.dms.payment;

import java.math.BigDecimal;
import java.time.Instant;

public record PaymentResponse(
    Long id,
    Long customerId,
    BigDecimal amount,
    String note,
    Instant createdAt
) {

    public static PaymentResponse from(Payment payment) {
        return new PaymentResponse(
            payment.getId(),
            payment.getCustomerId(),
            payment.getAmount(),
            payment.getNote(),
            payment.getCreatedAt()
        );
    }
}
