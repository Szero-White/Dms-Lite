package com.example.dms.sales;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;

public record SalesOrderItemRequest(
    @NotNull(message = "Product is required")
    @Positive(message = "Product id must be positive")
    Long productId,

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be greater than zero")
    Integer quantity,

    @PositiveOrZero(message = "Discount amount must be zero or positive")
    BigDecimal discountAmount
) {
}
