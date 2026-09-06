package com.example.dms.document;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DocumentNumberServiceTest {

    @Mock
    private DocumentNumberSequenceRepository sequenceRepository;

    @Test
    void formatsHumanReadableBusinessNumberUsingConfiguredBusinessDate() {
        ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
        Clock clock = Clock.fixed(Instant.parse("2026-09-05T23:30:00Z"), ZoneOffset.UTC);
        LocalDate expectedDate = LocalDate.of(2026, 9, 6);
        when(sequenceRepository.nextValue(7L, DocumentNumberType.SALES_ORDER, expectedDate))
            .thenReturn(12);

        DocumentNumberService service = new DocumentNumberService(sequenceRepository, zone, clock);

        assertThat(service.next(DocumentNumberType.SALES_ORDER, 7L))
            .isEqualTo("SO-20260906-0012");
    }

    @Test
    void supportsSequencesBeyondFourDigitsWithoutTruncation() {
        ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
        Clock clock = Clock.fixed(Instant.parse("2026-09-06T01:00:00Z"), ZoneOffset.UTC);
        LocalDate expectedDate = LocalDate.of(2026, 9, 6);
        when(sequenceRepository.nextValue(1L, DocumentNumberType.PAYMENT, expectedDate))
            .thenReturn(10000);

        DocumentNumberService service = new DocumentNumberService(sequenceRepository, zone, clock);

        assertThat(service.next(DocumentNumberType.PAYMENT, 1L))
            .isEqualTo("PAY-20260906-10000");
    }
}
