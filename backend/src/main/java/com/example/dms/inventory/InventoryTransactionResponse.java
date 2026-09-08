package com.example.dms.inventory;

import java.time.Instant;

public record InventoryTransactionResponse(
    Long id,
    Long warehouseId,
    Long productId,
    String sourceType,
    Long sourceId,
    String direction,
    Integer quantity,
    Integer beforeQuantity,
    Integer afterQuantity,
    String note,
    Instant createdAt
) {
    public static InventoryTransactionResponse from(InventoryTransaction transaction) {
        return new InventoryTransactionResponse(
            transaction.getId(),
            transaction.getWarehouseId(),
            transaction.getProductId(),
            transaction.getSourceType(),
            transaction.getSourceId(),
            transaction.getDirection(),
            transaction.getQuantity(),
            transaction.getBeforeQuantity(),
            transaction.getAfterQuantity(),
            transaction.getNote(),
            transaction.getCreatedAt()
        );
    }
}
