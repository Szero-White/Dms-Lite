package com.example.dms.sales;

import java.math.BigDecimal;
import java.time.Instant;

public record SalesOrderResponse(
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
    Instant confirmedAt
) {
}
