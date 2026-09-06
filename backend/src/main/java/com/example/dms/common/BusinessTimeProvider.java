package com.example.dms.common;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class BusinessTimeProvider {

    private final ZoneId businessZone;
    private final Clock clock;

    @Autowired
    public BusinessTimeProvider(
        @Value("${app.business-zone:Asia/Ho_Chi_Minh}") String businessZone
    ) {
        this(ZoneId.of(businessZone), Clock.system(ZoneId.of(businessZone)));
    }

    BusinessTimeProvider(ZoneId businessZone, Clock clock) {
        this.businessZone = businessZone;
        this.clock = clock;
    }

    public LocalDate today() {
        return LocalDate.now(clock.withZone(businessZone));
    }

    public Instant startOfDay(LocalDate date) {
        return date.atStartOfDay(businessZone).toInstant();
    }
}
