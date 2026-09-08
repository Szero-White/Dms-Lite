package com.example.dms.debt;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

public enum ReceivableDueStatus {
    CURRENT,
    DUE_SOON,
    DUE_TODAY,
    OVERDUE;

    public static final int DUE_SOON_DAYS = 3;

    public static ReceivableDueStatus from(LocalDate dueDate, LocalDate today) {
        if (dueDate == null || today == null) {
            return null;
        }
        if (dueDate.isBefore(today)) {
            return OVERDUE;
        }
        if (dueDate.isEqual(today)) {
            return DUE_TODAY;
        }
        if (!dueDate.isAfter(today.plusDays(DUE_SOON_DAYS))) {
            return DUE_SOON;
        }
        return CURRENT;
    }

    public static Long daysUntilDue(LocalDate dueDate, LocalDate today) {
        if (dueDate == null || today == null) {
            return null;
        }
        return ChronoUnit.DAYS.between(today, dueDate);
    }
}
