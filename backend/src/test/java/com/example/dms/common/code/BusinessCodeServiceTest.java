package com.example.dms.common.code;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BusinessCodeServiceTest {

    @Mock private BusinessCodeSequenceRepository sequenceRepository;

    @Test
    void formatsProductCodeWithStablePrefixAndWidth() {
        when(sequenceRepository.nextValue(12L, BusinessCodeType.PRODUCT)).thenReturn(42L);

        BusinessCodeService service = new BusinessCodeService(sequenceRepository);

        assertThat(service.next(BusinessCodeType.PRODUCT, 12L)).isEqualTo("PRD-000042");
    }
}
