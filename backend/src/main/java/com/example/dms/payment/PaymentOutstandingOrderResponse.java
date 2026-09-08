package com.example.dms.payment;

import com.example.dms.debt.ReceivableDueStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record PaymentOutstandingOrderResponse(
    Long salesOrderId,
    String salesOrderCode,
    Long customerId,
    String customerName,
    BigDecimal totalAmount,
    BigDecimal paidAmount,
    BigDecimal remainingAmount,
    LocalDate dueDate,
    Instant confirmedAt,
    ReceivableDueStatus dueStatus,
    Long daysUntilDue
) {
}
