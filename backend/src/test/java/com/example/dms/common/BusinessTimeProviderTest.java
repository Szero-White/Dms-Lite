package com.example.dms.common;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import org.junit.jupiter.api.Test;

class BusinessTimeProviderTest {

    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Test
    void usesBusinessZoneWhenUtcDateIsStillPreviousDay() {
        Clock clock = Clock.fixed(
            Instant.parse("2026-09-05T18:30:00Z"),
            ZoneId.of("UTC")
        );

        BusinessTimeProvider provider = new BusinessTimeProvider(BUSINESS_ZONE, clock);

        assertThat(provider.today()).isEqualTo(LocalDate.of(2026, 9, 6));
    }

    @Test
    void convertsBusinessDayStartToUtcInstant() {
        BusinessTimeProvider provider = new BusinessTimeProvider(
            BUSINESS_ZONE,
            Clock.fixed(Instant.parse("2026-09-06T00:00:00Z"), BUSINESS_ZONE)
        );

        assertThat(provider.startOfDay(LocalDate.of(2026, 9, 6)))
            .isEqualTo(Instant.parse("2026-09-05T17:00:00Z"));
    }
}
