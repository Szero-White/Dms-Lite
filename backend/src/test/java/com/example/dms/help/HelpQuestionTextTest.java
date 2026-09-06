package com.example.dms.help;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class HelpQuestionTextTest {

    @Test
    void extractsMultiSegmentBusinessDocumentNumber() {
        assertThat(HelpQuestionText.findProductOrOrderCode("Đơn SO-20260906-0002 đang ở trạng thái nào?"))
            .contains("SO-20260906-0002");
    }

    @Test
    void stillExtractsProductSku() {
        assertThat(HelpQuestionText.findProductOrOrderCode("TEA-24 hiện còn bao nhiêu hàng?"))
            .contains("TEA-24");
    }
}
