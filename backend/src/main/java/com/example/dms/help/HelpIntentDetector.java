package com.example.dms.help;

import java.util.List;
import org.springframework.stereotype.Component;

@Component
class HelpIntentDetector {

    private static final int CONTEXT_TURN_LIMIT = 6;

    HelpIntentMatch detect(HelpAskRequest request) {
        String question = HelpQuestionText.normalize(request.question());
        String searchableQuestion = buildSearchableQuestion(question, request.context());

        HelpIntent intent = detectIntent(searchableQuestion);
        if (intent != HelpIntent.UNKNOWN) {
            return new HelpIntentMatch(intent, false);
        }

        return new HelpIntentMatch(HelpIntent.UNKNOWN, isTooVague(question));
    }

    private HelpIntent detectIntent(String question) {
        if (containsAny(question, "test", "kiem thu", "thu nghiem", "uat", "qa", "toan bo he thong", "end to end", "e2e")) {
            return HelpIntent.TESTING;
        }
        if (containsAny(question, "bat dau", "su dung he thong", "dung he thong", "lan dau", "moi dung", "dau tien", "start using", "get started", "first time")) {
            return HelpIntent.ONBOARDING;
        }
        if (containsAny(question, "nhiem vu", "viec can lam", "nen lam gi", "lam gi tiep", "cong viec duoc giao", "hom nay lam gi", "assigned work", "what should i do")) {
            return HelpIntent.ASSIGNED_WORK;
        }
        if (containsAny(question, "khong thay", "khong hien", "mat man hinh", "an man hinh", "missing screen", "not showing", "sidebar")) {
            return HelpIntent.MISSING_SCREEN;
        }
        if (containsAny(
            question,
            "nhan vien", "tai khoan", "role", "vai tro", "phan quyen", "permission", "user", "staff",
            "staff account", "user account", "employee account", "login account", "account access",
            "create account", "manage account", "disable account", "deactivate account"
        )) {
            return HelpIntent.TEAM_ACCESS;
        }
        if (containsAny(question, "hoa don", "invoice", "phat hanh hoa don", "huy hoa don")) {
            return HelpIntent.INVOICE;
        }
        if (containsAny(question, "ban hang", "sales", "don hang", "order", "bao gia")) {
            return HelpIntent.SALES;
        }
        if (containsAny(question, "kho", "ton kho", "inventory", "stock", "nhap hang", "warehouse")) {
            return HelpIntent.INVENTORY;
        }
        if (containsAny(question, "cong no", "thanh toan", "payment", "debt", "thu tien", "finance")) {
            return HelpIntent.FINANCE;
        }
        if (containsAny(question, "san pham", "product", "sku", "ma hang", "gia ban", "catalog")) {
            return HelpIntent.PRODUCT;
        }
        if (containsAny(question, "khach hang", "customer", "dai ly", "credit")) {
            return HelpIntent.CUSTOMER;
        }
        if (containsAny(question, "bao cao", "dashboard", "report", "doanh thu", "revenue")) {
            return HelpIntent.REPORT;
        }

        return HelpIntent.UNKNOWN;
    }

    private String buildSearchableQuestion(String question, List<HelpAskRequest.ConversationTurn> context) {
        if (!isFollowUpQuestion(question) || context == null || context.isEmpty()) {
            return question;
        }

        StringBuilder builder = new StringBuilder(question);
        int start = Math.max(0, context.size() - CONTEXT_TURN_LIMIT);
        for (HelpAskRequest.ConversationTurn turn : context.subList(start, context.size())) {
            if (turn.content() != null && !turn.content().isBlank()) {
                builder.append(' ').append(HelpQuestionText.normalize(turn.content()));
            }
        }

        return builder.toString();
    }

    private boolean isFollowUpQuestion(String question) {
        return containsAny(
            question,
            "chi tiet", "cu the", "ro hon", "noi them", "giai thich them", "vi sao", "tai sao",
            "buoc tiep", "tiep theo", "cai do", "phan do", "no", "them di", "lam sao nua",
            "detail", "more", "explain", "why", "next", "that", "it", "continue"
        );
    }

    private boolean isTooVague(String question) {
        if (question.length() <= 8) {
            return true;
        }

        return containsAny(
            question,
            "giup toi", "hoi gi", "khong hieu", "lam sao", "cai nay", "huong dan toi", "help me", "how to", "what now"
        );
    }

    private boolean containsAny(String text, String... terms) {
        return HelpQuestionText.containsAny(text, terms);
    }
}
