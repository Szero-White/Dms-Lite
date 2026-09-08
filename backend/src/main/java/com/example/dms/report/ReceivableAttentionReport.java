package com.example.dms.report;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ReceivableAttentionReport(
    BigDecimal overdueAmount,
    long overdueCount,
    BigDecimal dueTodayAmount,
    long dueTodayCount,
    BigDecimal dueSoonAmount,
    long dueSoonCount,
    OverduePreview oldestOverdue
) {
    public record OverduePreview(
        Long salesOrderId,
        String salesOrderCode,
        Long customerId,
        String customerName,
        BigDecimal remainingAmount,
        LocalDate dueDate,
        long daysOverdue
    ) {
    }
}
