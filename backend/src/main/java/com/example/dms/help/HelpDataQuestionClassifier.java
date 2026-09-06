package com.example.dms.help;

import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class HelpDataQuestionClassifier {

    public boolean looksLikeDataQuestion(String normalizedQuestion) {
        return containsAny(
            normalizedQuestion,
            "bao nhieu", "co may", "con bao nhieu", "con lai", "hien co", "dang co", "trang thai", "status",
            "ton kho", "stock level", "cong no", "phai thu", "doanh thu", "so luong", "gia tri", "da thu",
            "how many", "how much", "count", "current", "available", "remaining", "receivable balance"
        );
    }

    public boolean isSalesOrderQuestion(String normalizedQuestion, Optional<String> code) {
        return code.filter(this::isSalesOrderCode).isPresent()
            && containsAny(
                normalizedQuestion,
                "trang thai", "status", "bao nhieu", "co may", "how much", "how many", "hien tai", "current",
                "tien", "tong tien", "tong gia tri", "gia tri", "da thu", "con phai thu", "phai thu", "cong no",
                "paid", "collected", "remaining", "receivable", "debt", "amount", "value"
            );
    }

    public boolean isStockQuestion(String normalizedQuestion, Optional<String> code) {
        if (containsAny(
            normalizedQuestion,
            "ton kho", "stock level", "stock quantity", "con hang", "hang ton", "so luong ton", "quantity on hand", "on hand"
        )) {
            return true;
        }

        boolean hasProductLikeCode = code.filter(this::isProductLikeCode).isPresent();
        return hasProductLikeCode && containsAny(
            normalizedQuestion,
            "bao nhieu hang", "co may", "con bao nhieu", "hien con", "con lai",
            "how many left", "how much left", "available", "remaining"
        );
    }

    public boolean isDebtQuestion(String normalizedQuestion) {
        return containsAny(
            normalizedQuestion,
            "cong no", "no bao nhieu", "phai thu", "debt", "receivable", "receivable balance", "owes"
        );
    }

    public boolean isOrderQuestion(String normalizedQuestion) {
        return containsAny(
            normalizedQuestion,
            "don hang", "don ban hang", "sales order", "order", "trang thai don", "order status"
        );
    }

    public boolean isProductCountQuestion(String normalizedQuestion) {
        return containsAny(normalizedQuestion, "san pham", "product", "ma hang", "sku")
            && isAggregateCountQuestion(normalizedQuestion);
    }

    public boolean isCustomerCountQuestion(String normalizedQuestion) {
        return containsAny(normalizedQuestion, "khach hang", "customer")
            && isAggregateCountQuestion(normalizedQuestion);
    }

    public boolean isOrderCountQuestion(String normalizedQuestion) {
        return isOrderQuestion(normalizedQuestion) && isAggregateCountQuestion(normalizedQuestion);
    }

    public boolean isAggregateDebtQuestion(String normalizedQuestion) {
        return containsAny(
            normalizedQuestion,
            "tong cong no", "tong no", "tong phai thu", "toan bo cong no", "toan cong ty", "cua cong ty",
            "total receivable", "total receivables", "total debt", "overall receivable", "company receivable"
        );
    }

    public boolean isAggregateCountQuestion(String normalizedQuestion) {
        return containsAny(
            normalizedQuestion,
            "bao nhieu", "co may", "so luong", "tong so", "how many", "count", "total number", "total"
        );
    }

    public boolean isSalesOrderCode(String code) {
        return hasPrefix(code, "SO-");
    }

    public boolean isProductLikeCode(String code) {
        return code != null
            && !hasPrefix(code, "SO-")
            && !hasPrefix(code, "INV-")
            && !hasPrefix(code, "PAY-");
    }

    private boolean hasPrefix(String value, String prefix) {
        return value != null && value.regionMatches(true, 0, prefix, 0, prefix.length());
    }

    private boolean containsAny(String text, String... terms) {
        return HelpQuestionText.containsAny(text, terms);
    }
}
