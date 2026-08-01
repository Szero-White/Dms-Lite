package com.example.dms.help;

import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class HelpAssistantService {

    private final HelpWorkflowKnowledge knowledge;

    public HelpAnswerResponse answer(HelpAskRequest request, Authentication authentication) {
        HelpPermissionScope scope = HelpPermissionScope.from(authentication);
        String question = request.question().trim().toLowerCase(Locale.ROOT);

        if (containsAny(question, "nhan vien", "tai khoan", "role", "phan quyen", "permission", "user")) {
            return scope.canManageTeam() ? knowledge.teamAccessAnswer() : knowledge.outOfScopeAnswer(scope, "Team Access");
        }
        if (containsAny(question, "ban hang", "sales", "don hang", "order", "bao gia")) {
            return scope.canUseSales() ? knowledge.salesAnswer(scope) : knowledge.outOfScopeAnswer(scope, "Sales Orders");
        }
        if (containsAny(question, "kho", "ton kho", "inventory", "stock", "nhap hang")) {
            return scope.canUseInventory() ? knowledge.inventoryAnswer(scope) : knowledge.outOfScopeAnswer(scope, "Inventory");
        }
        if (containsAny(question, "cong no", "thanh toan", "payment", "debt", "thu tien")) {
            return scope.canUseFinance() ? knowledge.financeAnswer(scope) : knowledge.outOfScopeAnswer(scope, "Payments/Debt");
        }
        if (containsAny(question, "san pham", "product", "sku", "gia ban", "catalog")) {
            return scope.canUseProducts() ? knowledge.productAnswer(scope) : knowledge.outOfScopeAnswer(scope, "Products");
        }
        if (containsAny(question, "khach hang", "customer", "dai ly", "credit")) {
            return scope.canUseCustomers() ? knowledge.customerAnswer(scope) : knowledge.outOfScopeAnswer(scope, "Customers");
        }
        if (containsAny(question, "bao cao", "dashboard", "report", "doanh thu")) {
            return scope.canUseReports() ? knowledge.reportAnswer() : knowledge.outOfScopeAnswer(scope, "Reports");
        }

        return knowledge.generalAnswer(scope);
    }

    private boolean containsAny(String text, String... terms) {
        for (String term : terms) {
            if (text.contains(term)) {
                return true;
            }
        }
        return false;
    }
}
