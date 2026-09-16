package com.example.dms.common.code;

import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BusinessCodeService {

    private final BusinessCodeSequenceRepository sequenceRepository;

    @Transactional(propagation = Propagation.MANDATORY)
    public String next(BusinessCodeType type, Long tenantId) {
        long sequence = sequenceRepository.nextValue(tenantId, type);
        return String.format(
            Locale.ROOT,
            "%s-%0" + type.width() + "d",
            type.prefix(),
            sequence
        );
    }
}
