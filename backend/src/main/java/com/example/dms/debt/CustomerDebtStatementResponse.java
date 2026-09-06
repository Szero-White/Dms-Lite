package com.example.dms.debt;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record CustomerDebtStatementResponse(
    Long id,
    Long customerId,
    String sourceType,
    Long sourceId,
    String sourceCode,
    String direction,
    BigDecimal amount,
    BigDecimal remainingAmount,
    LocalDate dueDate,
    String note,
    Instant createdAt
) {
}
