package com.example.dms.help;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

class HelpDataResponseFactoryTest {

    private final HelpDataResponseFactory responses = new HelpDataResponseFactory();

    @Test
    void englishMoneyKeepsVndCurrencyInsteadOfUsingUsdLocaleCurrency() {
        assertThat(responses.money(new BigDecimal("2300000"), HelpLocale.EN))
            .isEqualTo("2,300,000 VND");
    }

    @Test
    void vietnameseMoneyKeepsVndCurrency() {
        assertThat(responses.money(new BigDecimal("2300000"), HelpLocale.VI))
            .isEqualTo("2.300.000 ₫");
    }

    @Test
    void liveDataResponsesAreOwnedByTheBackend() {
        HelpAnswerResponse answer = responses.response(
            "Stock answer",
            List.of("Review Inventory"),
            List.of("Inventory"),
            List.of("Scoped lookup"),
            HelpLocale.EN
        );

        assertThat(answer.answerSource()).isEqualTo(HelpAnswerSource.LIVE_DATA);
        assertThat(answer.generationProvider()).isEqualTo(HelpGenerationProvider.NONE);
    }
}
