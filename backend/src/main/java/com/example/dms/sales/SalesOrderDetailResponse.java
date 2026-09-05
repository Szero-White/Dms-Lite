package com.example.dms.sales;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record SalesOrderDetailResponse(
    Long id,
    Long customerId,
    String customerName,
    Long warehouseId,
    String warehouseName,
    String code,
    SalesOrderStatus status,
    BigDecimal totalAmount,
    BigDecimal paidAmount,
    BigDecimal debtAmount,
    Instant createdAt,
    Instant confirmedAt,
    List<SalesOrderItemResponse> items
) {
}
