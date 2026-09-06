package com.example.dms.invoice;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class InvoicePdfLanguageTest {

    @Test
    void resolvesVietnameseFromAcceptLanguage() {
        assertThat(InvoicePdfLanguage.fromAcceptLanguage("vi")).isEqualTo(InvoicePdfLanguage.VI);
        assertThat(InvoicePdfLanguage.fromAcceptLanguage("vi-VN,vi;q=0.9,en;q=0.8"))
            .isEqualTo(InvoicePdfLanguage.VI);
        assertThat(InvoicePdfText.forLanguage(InvoicePdfLanguage.VI).title())
            .isEqualTo("HÓA ĐƠN BÁN HÀNG");
    }

    @Test
    void defaultsToEnglishForEnglishOrMissingLanguage() {
        assertThat(InvoicePdfLanguage.fromAcceptLanguage("en-US,en;q=0.9")).isEqualTo(InvoicePdfLanguage.EN);
        assertThat(InvoicePdfLanguage.fromAcceptLanguage(null)).isEqualTo(InvoicePdfLanguage.EN);
        assertThat(InvoicePdfText.forLanguage(InvoicePdfLanguage.EN).title())
            .isEqualTo("SALES INVOICE");
    }
}
