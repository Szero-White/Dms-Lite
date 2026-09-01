package com.example.dms.inventory;

public record WarehouseResponse(
    Long id,
    String name
) {
    static WarehouseResponse from(Warehouse warehouse) {
        return new WarehouseResponse(warehouse.getId(), warehouse.getName());
    }
}
