package com.example.dms.sales;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.util.List;

public record CreateSalesOrderRequest(
    @NotNull(message = "Customer is required")
    @Positive(message = "Customer id must be positive")
    Long customerId,

    @NotNull(message = "Warehouse is required")
    @Positive(message = "Warehouse id must be positive")
    Long warehouseId,

    @NotEmpty(message = "Sales order items must not be empty")
    List<@Valid SalesOrderItemRequest> items
) {
}
