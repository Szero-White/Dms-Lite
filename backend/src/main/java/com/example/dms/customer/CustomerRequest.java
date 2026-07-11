package com.example.dms.customer;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

public record CustomerRequest(
    @NotBlank String name,
    String phone,
    String address,
    BigDecimal creditLimit,
    Integer paymentTermDays
) {
}
