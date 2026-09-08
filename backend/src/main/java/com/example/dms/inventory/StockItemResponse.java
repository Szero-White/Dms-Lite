package com.example.dms.inventory;

public record StockItemResponse(
    Long id,
    Long warehouseId,
    Long productId,
    Integer quantityOnHand
) {
    public static StockItemResponse from(StockItem stockItem) {
        return new StockItemResponse(
            stockItem.getId(),
            stockItem.getWarehouseId(),
            stockItem.getProductId(),
            stockItem.getQuantityOnHand()
        );
    }
}
