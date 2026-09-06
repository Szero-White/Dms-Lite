package com.example.dms.invoice;

import java.util.Locale;

public enum InvoicePdfLanguage {
    VI(Locale.forLanguageTag("vi-VN")),
    EN(Locale.US);

    private final Locale locale;

    InvoicePdfLanguage(Locale locale) {
        this.locale = locale;
    }

    public Locale locale() {
        return locale;
    }

    public static InvoicePdfLanguage fromAcceptLanguage(String acceptLanguage) {
        if (acceptLanguage == null || acceptLanguage.isBlank()) {
            return EN;
        }
        String normalized = acceptLanguage.trim().toLowerCase(Locale.ROOT);
        return normalized.startsWith("vi") ? VI : EN;
    }
}
