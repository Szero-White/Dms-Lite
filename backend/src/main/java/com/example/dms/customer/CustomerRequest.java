package com.example.dms.customer;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;

public record CustomerRequest(
    @NotBlank String name,
    String phone,
    String address,
    @PositiveOrZero(message = "Credit limit must be zero or positive")
    BigDecimal creditLimit,
    @PositiveOrZero(message = "Payment term days must be zero or positive")
    Integer paymentTermDays
) {
}
