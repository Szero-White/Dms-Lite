package com.example.dms.document;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DocumentNumberService {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.BASIC_ISO_DATE;

    private final DocumentNumberSequenceRepository sequenceRepository;
    private final ZoneId businessZone;
    private final Clock clock;

    @Autowired
    public DocumentNumberService(
        DocumentNumberSequenceRepository sequenceRepository,
        @Value("${app.business-zone:Asia/Ho_Chi_Minh}") String businessZone
    ) {
        this(sequenceRepository, ZoneId.of(businessZone), Clock.system(ZoneId.of(businessZone)));
    }

    DocumentNumberService(
        DocumentNumberSequenceRepository sequenceRepository,
        ZoneId businessZone,
        Clock clock
    ) {
        this.sequenceRepository = sequenceRepository;
        this.businessZone = businessZone;
        this.clock = clock;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public String next(DocumentNumberType type, Long tenantId) {
        LocalDate businessDate = LocalDate.now(clock.withZone(businessZone));
        int sequence = sequenceRepository.nextValue(tenantId, type, businessDate);
        return String.format(
            Locale.ROOT,
            "%s-%s-%04d",
            type.prefix(),
            businessDate.format(DATE_FORMAT),
            sequence
        );
    }
}
