package com.example.dms.product;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;

public record ProductRequest(
    @NotBlank String name,
    @NotBlank String sku,
    String barcode,
    @NotNull @PositiveOrZero(message = "Cost price must be zero or positive") BigDecimal costPrice,
    @NotNull @PositiveOrZero(message = "Selling price must be zero or positive") BigDecimal sellingPrice,
    @NotNull @PositiveOrZero(message = "Minimum stock must be zero or positive") Integer minStock
) {
}
