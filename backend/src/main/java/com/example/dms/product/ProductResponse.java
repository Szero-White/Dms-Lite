package com.example.dms.product;

import java.math.BigDecimal;

public record ProductResponse(
    Long id,
    String name,
    String sku,
    String barcode,
    BigDecimal costPrice,
    BigDecimal sellingPrice,
    Integer minStock,
    boolean active
) {
}
