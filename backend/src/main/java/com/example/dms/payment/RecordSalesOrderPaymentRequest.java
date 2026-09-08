package com.example.dms.payment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record RecordSalesOrderPaymentRequest(
    @NotNull(message = "Sales order is required")
    @Positive(message = "Sales order id must be positive")
    Long salesOrderId,

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be greater than zero")
    BigDecimal amount,

    @Size(max = 500, message = "Note must not exceed 500 characters")
    String note,

    @NotBlank(message = "Payment request key is required")
    @Size(max = 64, message = "Payment request key must not exceed 64 characters")
    String requestKey
) {
}
