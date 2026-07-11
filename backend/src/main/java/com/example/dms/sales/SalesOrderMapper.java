package com.example.dms.sales;

import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class SalesOrderMapper {

    public SalesOrderResponse toResponse(SalesOrder salesOrder) {
        return new SalesOrderResponse(
            salesOrder.getId(),
            salesOrder.getCustomerId(),
            salesOrder.getWarehouseId(),
            salesOrder.getCode(),
            salesOrder.getStatus(),
            salesOrder.getTotalAmount(),
            salesOrder.getPaidAmount(),
            salesOrder.getDebtAmount(),
            salesOrder.getCreatedAt(),
            salesOrder.getConfirmedAt()
        );
    }

    public SalesOrderDetailResponse toDetailResponse(SalesOrder salesOrder) {
        List<SalesOrderItemResponse> itemResponses = salesOrder.getItems()
            .stream()
            .map(this::toItemResponse)
            .toList();

        return new SalesOrderDetailResponse(
            salesOrder.getId(),
            salesOrder.getCustomerId(),
            salesOrder.getWarehouseId(),
            salesOrder.getCode(),
            salesOrder.getStatus(),
            salesOrder.getTotalAmount(),
            salesOrder.getPaidAmount(),
            salesOrder.getDebtAmount(),
            salesOrder.getCreatedAt(),
            salesOrder.getConfirmedAt(),
            itemResponses
        );
    }

    private SalesOrderItemResponse toItemResponse(SalesOrderItem salesOrderItem) {
        return new SalesOrderItemResponse(
            salesOrderItem.getId(),
            salesOrderItem.getProductId(),
            salesOrderItem.getQuantity(),
            salesOrderItem.getUnitPrice(),
            salesOrderItem.getDiscountAmount(),
            salesOrderItem.getLineTotal()
        );
    }
}
