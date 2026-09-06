package com.example.dms.help;

import org.springframework.stereotype.Component;

@Component
public class HelpWorkflowKnowledge {

    private final AdminWorkflowKnowledge admin = new AdminWorkflowKnowledge();
    private final SalesWorkflowKnowledge sales = new SalesWorkflowKnowledge();
    private final OperationsWorkflowKnowledge operations = new OperationsWorkflowKnowledge();
    private final FinanceWorkflowKnowledge finance = new FinanceWorkflowKnowledge();
    private final GeneralWorkflowKnowledge general = new GeneralWorkflowKnowledge();

    public HelpAnswerResponse teamAccessAnswer(HelpPermissionScope scope, HelpLocale locale) {
        return admin.teamAccessAnswer(scope, locale);
    }

    public HelpAnswerResponse salesAnswer(HelpPermissionScope scope, HelpLocale locale) {
        return sales.salesAnswer(scope, locale);
    }

    public HelpAnswerResponse invoiceAnswer(HelpPermissionScope scope, HelpLocale locale) {
        return sales.invoiceAnswer(scope, locale);
    }

    public HelpAnswerResponse inventoryAnswer(HelpPermissionScope scope, HelpLocale locale) {
        return operations.inventoryAnswer(scope, locale);
    }

    public HelpAnswerResponse financeAnswer(HelpPermissionScope scope, HelpLocale locale) {
        return finance.financeAnswer(scope, locale);
    }

    public HelpAnswerResponse productAnswer(HelpPermissionScope scope, HelpLocale locale) {
        return operations.productAnswer(scope, locale);
    }

    public HelpAnswerResponse customerAnswer(HelpPermissionScope scope, HelpLocale locale) {
        return operations.customerAnswer(scope, locale);
    }

    public HelpAnswerResponse reportAnswer(HelpPermissionScope scope, HelpLocale locale) {
        return finance.reportAnswer(scope, locale);
    }

    public HelpAnswerResponse testingGuideAnswer(HelpPermissionScope scope, HelpLocale locale) {
        return general.testingGuideAnswer(scope, locale);
    }

    public HelpAnswerResponse onboardingAnswer(HelpPermissionScope scope, HelpLocale locale) {
        return general.onboardingAnswer(scope, locale);
    }

    public HelpAnswerResponse assignedWorkAnswer(HelpPermissionScope scope, HelpLocale locale) {
        return general.assignedWorkAnswer(scope, locale);
    }

    public HelpAnswerResponse generalAnswer(HelpPermissionScope scope, HelpLocale locale) {
        return general.generalAnswer(scope, locale);
    }

    public HelpAnswerResponse clarifyingQuestionAnswer(HelpPermissionScope scope, HelpLocale locale) {
        return general.clarifyingQuestionAnswer(scope, locale);
    }

    public HelpAnswerResponse missingScreenAnswer(HelpPermissionScope scope, HelpLocale locale) {
        return general.missingScreenAnswer(scope, locale);
    }

    public HelpAnswerResponse outOfScopeAnswer(
        HelpPermissionScope scope,
        String requestedArea,
        HelpLocale locale
    ) {
        return general.outOfScopeAnswer(scope, requestedArea, locale);
    }
}
