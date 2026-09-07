package com.example.dms.invoice;

import java.math.BigDecimal;
import java.time.Instant;

public record InvoiceEligibleSalesOrderResponse(
    Long salesOrderId,
    String salesOrderCode,
    Long customerId,
    String customerName,
    BigDecimal totalAmount,
    Instant confirmedAt
) {
}
