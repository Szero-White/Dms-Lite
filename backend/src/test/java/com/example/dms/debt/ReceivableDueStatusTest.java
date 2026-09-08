package com.example.dms.debt;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class ReceivableDueStatusTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 9, 8);

    @Test
    void classifiesReceivableDueDatesUsingThreeDayWarningWindow() {
        assertThat(ReceivableDueStatus.from(LocalDate.of(2026, 9, 7), TODAY))
            .isEqualTo(ReceivableDueStatus.OVERDUE);
        assertThat(ReceivableDueStatus.from(TODAY, TODAY))
            .isEqualTo(ReceivableDueStatus.DUE_TODAY);
        assertThat(ReceivableDueStatus.from(LocalDate.of(2026, 9, 11), TODAY))
            .isEqualTo(ReceivableDueStatus.DUE_SOON);
        assertThat(ReceivableDueStatus.from(LocalDate.of(2026, 9, 12), TODAY))
            .isEqualTo(ReceivableDueStatus.CURRENT);
    }

    @Test
    void reportsSignedDaysUntilDue() {
        assertThat(ReceivableDueStatus.daysUntilDue(LocalDate.of(2026, 9, 7), TODAY)).isEqualTo(-1);
        assertThat(ReceivableDueStatus.daysUntilDue(TODAY, TODAY)).isZero();
        assertThat(ReceivableDueStatus.daysUntilDue(LocalDate.of(2026, 9, 10), TODAY)).isEqualTo(2);
    }
}
