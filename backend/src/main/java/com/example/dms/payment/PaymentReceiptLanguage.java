package com.example.dms.payment;

import java.util.Locale;

public enum PaymentReceiptLanguage {
    VI(Locale.forLanguageTag("vi-VN")),
    EN(Locale.ENGLISH);

    private final Locale locale;

    PaymentReceiptLanguage(Locale locale) {
        this.locale = locale;
    }

    public Locale locale() {
        return locale;
    }

    public static PaymentReceiptLanguage fromAcceptLanguage(String acceptLanguage) {
        if (acceptLanguage != null && acceptLanguage.toLowerCase(Locale.ROOT).startsWith("vi")) {
            return VI;
        }
        return EN;
    }
}
