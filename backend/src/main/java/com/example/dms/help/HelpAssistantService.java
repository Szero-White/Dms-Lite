package com.example.dms.help;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class HelpAssistantService {

    private final HelpIntentDetector intentDetector;

    private final HelpWorkflowKnowledge knowledge;

    private final HelpDataAnswerService dataAnswerService;

    private final GeminiHelpAssistantClient geminiClient;

    public HelpAnswerResponse answer(HelpAskRequest request, Authentication authentication) {
        HelpPermissionScope scope = HelpPermissionScope.from(authentication);
        HelpLocale locale = HelpLocale.from(request.locale(), request.question());

        return dataAnswerService.answer(request, scope, locale)
            .orElseGet(() -> answerWorkflowQuestion(request, scope, locale));
    }

    private HelpAnswerResponse answerWorkflowQuestion(
        HelpAskRequest request,
        HelpPermissionScope scope,
        HelpLocale locale
    ) {
        HelpIntentMatch intent = intentDetector.detect(request);
        HelpAnswerResponse fallback = answerIntent(intent, scope, locale);

        if (fallback.blocked() || intent.needsClarification()) {
            return fallback;
        }

        return geminiClient.answer(request, scope, locale, fallback).orElse(fallback);
    }

    private HelpAnswerResponse answerIntent(HelpIntentMatch intent, HelpPermissionScope scope, HelpLocale locale) {
        if (intent.needsClarification()) {
            return knowledge.clarifyingQuestionAnswer(scope, locale);
        }

        return switch (intent.intent()) {
            case TESTING -> knowledge.testingGuideAnswer(scope, locale);
            case ONBOARDING -> knowledge.onboardingAnswer(scope, locale);
            case ASSIGNED_WORK -> knowledge.assignedWorkAnswer(scope, locale);
            case MISSING_SCREEN -> knowledge.missingScreenAnswer(scope, locale);
            case TEAM_ACCESS -> scope.canManageTeam()
                ? knowledge.teamAccessAnswer(scope, locale)
                : knowledge.outOfScopeAnswer(scope, "Team Access", locale);
            case SALES -> scope.canUseSales()
                ? knowledge.salesAnswer(scope, locale)
                : knowledge.outOfScopeAnswer(scope, "Sales Orders", locale);
            case INVOICE -> scope.canUseInvoices()
                ? knowledge.invoiceAnswer(scope, locale)
                : knowledge.outOfScopeAnswer(scope, "Invoices", locale);
            case INVENTORY -> scope.canUseInventory()
                ? knowledge.inventoryAnswer(scope, locale)
                : knowledge.outOfScopeAnswer(scope, "Inventory", locale);
            case FINANCE -> scope.canUseFinance()
                ? knowledge.financeAnswer(scope, locale)
                : knowledge.outOfScopeAnswer(scope, "Payments/Debt", locale);
            case PRODUCT -> scope.canUseProducts()
                ? knowledge.productAnswer(scope, locale)
                : knowledge.outOfScopeAnswer(scope, "Products", locale);
            case CUSTOMER -> scope.canUseCustomers()
                ? knowledge.customerAnswer(scope, locale)
                : knowledge.outOfScopeAnswer(scope, "Customers", locale);
            case REPORT -> scope.canUseReports()
                ? knowledge.reportAnswer(scope, locale)
                : knowledge.outOfScopeAnswer(scope, "Reports", locale);
            case UNKNOWN -> knowledge.generalAnswer(scope, locale);
        };
    }
}
