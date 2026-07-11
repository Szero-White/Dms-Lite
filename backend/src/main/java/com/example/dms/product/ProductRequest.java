package com.example.dms.product;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record ProductRequest(
    @NotBlank String name,
    @NotBlank String sku,
    String barcode,
    @NotNull BigDecimal costPrice,
    @NotNull BigDecimal sellingPrice,
    @NotNull Integer minStock
) {
}
