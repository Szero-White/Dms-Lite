package com.example.dms.inventory;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record StockReceiveRequest(

    @NotNull(message = "Warehouse is required")
    @Positive(message = "Warehouse id must be positive")
    Long warehouseId,

    @NotNull(message = "Product is required")
    @Positive(message = "Product id must be positive")
    Long productId,

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be greater than zero")
    Integer quantity,

    String note
) {
}