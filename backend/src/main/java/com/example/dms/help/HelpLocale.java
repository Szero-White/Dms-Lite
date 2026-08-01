package com.example.dms.help;

import java.util.Locale;

public enum HelpLocale {
    EN,
    VI;

    public static HelpLocale from(String requestedLocale, String question) {
        if (HelpQuestionText.looksVietnamese(question)) {
            return VI;
        }
        if (requestedLocale != null && requestedLocale.toLowerCase(Locale.ROOT).startsWith("vi")) {
            return VI;
        }

        return EN;
    }
}
