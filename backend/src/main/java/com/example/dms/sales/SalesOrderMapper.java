package com.example.dms.sales;

import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class SalesOrderMapper {

    public SalesOrderResponse toResponse(SalesOrder salesOrder) {
        return toResponse(salesOrder, true, null, null);
    }

    public SalesOrderResponse toResponse(SalesOrder salesOrder, boolean includeFinancials) {
        return toResponse(salesOrder, includeFinancials, null, null);
    }

    public SalesOrderResponse toResponse(
        SalesOrder salesOrder,
        boolean includeFinancials,
        String customerName,
        String warehouseName
    ) {
        return new SalesOrderResponse(
            salesOrder.getId(),
            salesOrder.getCustomerId(),
            customerName,
            salesOrder.getWarehouseId(),
            warehouseName,
            salesOrder.getCode(),
            salesOrder.getStatus(),
            includeFinancials ? salesOrder.getTotalAmount() : null,
            includeFinancials ? salesOrder.getPaidAmount() : null,
            includeFinancials ? salesOrder.getDebtAmount() : null,
            salesOrder.getCreatedAt(),
            salesOrder.getConfirmedAt()
        );
    }

    public SalesOrderDetailResponse toDetailResponse(SalesOrder salesOrder) {
        return toDetailResponse(salesOrder, true, null, null);
    }

    public SalesOrderDetailResponse toDetailResponse(SalesOrder salesOrder, boolean includeFinancials) {
        return toDetailResponse(salesOrder, includeFinancials, null, null);
    }

    public SalesOrderDetailResponse toDetailResponse(
        SalesOrder salesOrder,
        boolean includeFinancials,
        String customerName,
        String warehouseName
    ) {
        List<SalesOrderItemResponse> itemResponses = salesOrder.getItems()
            .stream()
            .map(item -> toItemResponse(item, includeFinancials))
            .toList();

        return new SalesOrderDetailResponse(
            salesOrder.getId(),
            salesOrder.getCustomerId(),
            customerName,
            salesOrder.getWarehouseId(),
            warehouseName,
            salesOrder.getCode(),
            salesOrder.getStatus(),
            includeFinancials ? salesOrder.getTotalAmount() : null,
            includeFinancials ? salesOrder.getPaidAmount() : null,
            includeFinancials ? salesOrder.getDebtAmount() : null,
            salesOrder.getCreatedAt(),
            salesOrder.getConfirmedAt(),
            itemResponses
        );
    }

    private SalesOrderItemResponse toItemResponse(
        SalesOrderItem salesOrderItem,
        boolean includeFinancials
    ) {
        return new SalesOrderItemResponse(
            salesOrderItem.getId(),
            salesOrderItem.getProductId(),
            salesOrderItem.getQuantity(),
            includeFinancials ? salesOrderItem.getUnitPrice() : null,
            includeFinancials ? salesOrderItem.getDiscountAmount() : null,
            includeFinancials ? salesOrderItem.getLineTotal() : null
        );
    }
}
