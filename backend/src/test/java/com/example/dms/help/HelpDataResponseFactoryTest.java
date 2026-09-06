package com.example.dms.help;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
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
}
