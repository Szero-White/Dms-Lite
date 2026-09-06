package com.example.dms.help;

import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class HelpDataAnswerService {

    private final HelpDataQuestionClassifier classifier;
    private final InventoryHelpDataService inventoryData;
    private final DebtHelpDataService debtData;
    private final SalesOrderHelpDataService salesOrderData;
    private final CatalogHelpDataService catalogData;

    @Transactional(readOnly = true)
    public Optional<HelpAnswerResponse> answer(
        HelpAskRequest request,
        HelpPermissionScope scope,
        HelpLocale locale
    ) {
        String normalizedQuestion = HelpQuestionText.normalize(request.question());
        if (!classifier.looksLikeDataQuestion(normalizedQuestion)) {
            return Optional.empty();
        }

        Optional<String> code = HelpQuestionText.findProductOrOrderCode(request.question());

        // Explicit document numbers outrank generic finance wording so one SO lookup
        // cannot accidentally become a tenant-wide debt question.
        if (classifier.isSalesOrderQuestion(normalizedQuestion, code)) {
            return Optional.of(salesOrderData.answer(request.question(), normalizedQuestion, scope, locale));
        }
        if (classifier.isStockQuestion(normalizedQuestion, code)) {
            return Optional.of(inventoryData.answer(request.question(), normalizedQuestion, scope, locale));
        }
        if (classifier.isDebtQuestion(normalizedQuestion)) {
            return Optional.of(debtData.answer(request.question(), normalizedQuestion, scope, locale));
        }
        if (classifier.isOrderQuestion(normalizedQuestion)) {
            return Optional.of(salesOrderData.answer(request.question(), normalizedQuestion, scope, locale));
        }
        if (classifier.isProductCountQuestion(normalizedQuestion)) {
            return Optional.of(catalogData.productSummary(scope, locale));
        }
        if (classifier.isCustomerCountQuestion(normalizedQuestion)) {
            return Optional.of(catalogData.customerSummary(scope, locale));
        }

        return Optional.empty();
    }
}
