package com.example.dms.report;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record SalesReport(
    Summary summary,
    List<SalesOrderRow> orders
) {
    public record Summary(
        BigDecimal recognizedRevenue,
        long totalOrders,
        BigDecimal averageCompletedOrderValue,
        long completedOrders
    ) {
    }

    public record SalesOrderRow(
        Long id,
        String code,
        Long customerId,
        String customerName,
        String status,
        BigDecimal totalAmount,
        BigDecimal collectedAmount,
        BigDecimal remainingReceivable,
        Integer collectionProgress,
        boolean receivableRecognized,
        Instant reportDate,
        Instant createdAt,
        Instant confirmedAt
    ) {
    }
}
