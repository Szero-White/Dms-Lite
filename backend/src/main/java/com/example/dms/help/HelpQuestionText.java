package com.example.dms.help;

import java.text.Normalizer;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

final class HelpQuestionText {

    private static final Set<String> COMMON_VIETNAMESE_WORDS = Set.of(
        "toi",
        "minh",
        "nhan vien",
        "tai khoan",
        "phan quyen",
        "don hang",
        "kho",
        "ton kho",
        "cong no",
        "thanh toan",
        "khach hang",
        "san pham",
        "bao cao"
    );

    private static final String VIETNAMESE_ONLY_LETTERS = "ăâđêôơưĂÂĐÊÔƠƯ";

    private static final Pattern PRODUCT_OR_ORDER_CODE = Pattern.compile(
        "\\b[A-Z]{2,}[A-Z0-9]*[-_][A-Z0-9]+\\b"
    );

    private HelpQuestionText() {
    }

    static String normalize(String value) {
        return Normalizer.normalize(value == null ? "" : value.trim(), Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "")
            .toLowerCase(Locale.ROOT);
    }

    static boolean looksVietnamese(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }

        String normalized = normalize(value);
        return COMMON_VIETNAMESE_WORDS.stream().anyMatch(normalized::contains)
            || value.chars().anyMatch(HelpQuestionText::isVietnameseOnlyLetter);
    }

    static boolean containsAny(String text, String... terms) {
        for (String term : terms) {
            if (text.contains(term)) {
                return true;
            }
        }
        return false;
    }

    static Optional<String> findProductOrOrderCode(String text) {
        Matcher matcher = PRODUCT_OR_ORDER_CODE.matcher((text == null ? "" : text).toUpperCase(Locale.ROOT));
        return matcher.find() ? Optional.of(matcher.group()) : Optional.empty();
    }

    private static boolean isVietnameseOnlyLetter(int codePoint) {
        return VIETNAMESE_ONLY_LETTERS.indexOf(codePoint) >= 0;
    }
}
