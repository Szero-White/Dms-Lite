package com.example.dms.sales;

import java.math.BigDecimal;
import java.time.Instant;

public record SalesOrderResponse(
    Long id,
    Long customerId,
    Long warehouseId,
    String code,
    String status,
    BigDecimal totalAmount,
    BigDecimal paidAmount,
    BigDecimal debtAmount,
    Instant createdAt,
    Instant confirmedAt
) {
}
