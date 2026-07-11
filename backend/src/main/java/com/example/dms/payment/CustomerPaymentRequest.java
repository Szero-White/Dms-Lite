package com.example.dms.payment;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record CustomerPaymentRequest(
    @NotNull(message = "Customer is required")
    @Positive(message = "Customer id must be positive")
    Long customerId,

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be greater than zero")
    BigDecimal amount,

    String note
) {
}
