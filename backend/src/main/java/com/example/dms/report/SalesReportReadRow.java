package com.example.dms.report;

import java.math.BigDecimal;
import java.time.Instant;

record SalesReportReadRow(
    Long id,
    String code,
    Long customerId,
    String customerName,
    String status,
    BigDecimal totalAmount,
    Instant reportDate,
    Instant createdAt,
    Instant confirmedAt
) {
}
