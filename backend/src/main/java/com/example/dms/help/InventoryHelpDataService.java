package com.example.dms.help;

import com.example.dms.common.TenantContext;
import com.example.dms.inventory.StockItemRepository;
import com.example.dms.product.Product;
import com.example.dms.product.ProductRepository;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class InventoryHelpDataService {

    private final ProductRepository products;
    private final StockItemRepository stockItems;
    private final HelpDataQuestionClassifier classifier;
    private final HelpDataResponseFactory responses;

    public HelpAnswerResponse answer(
        String question,
        String normalizedQuestion,
        HelpPermissionScope scope,
        HelpLocale locale
    ) {
        if (!scope.canViewInventoryData()) {
            return responses.blocked(scope, "Inventory", locale);
        }

        Long tenantId = TenantContext.tenantRequired();
        Optional<String> extractedCode = HelpQuestionText.findProductOrOrderCode(question);
        Optional<String> requestedProductCode = extractedCode.filter(classifier::isProductLikeCode);
        Optional<Product> product = requestedProductCode
            .flatMap(code -> products.findFirstByTenantIdAndDeletedAtIsNullAndSkuIgnoreCase(tenantId, code));

        if (requestedProductCode.isPresent() && product.isEmpty()) {
            return responses.notFound(
                locale == HelpLocale.VI
                    ? "Mình không tìm thấy mã hàng " + requestedProductCode.get() + " trong doanh nghiệp hiện tại."
                    : "I could not find product code " + requestedProductCode.get() + " in the current tenant.",
                scope.relatedModules(locale, "Inventory", "Products"),
                locale
            );
        }

        if (extractedCode.isPresent() && requestedProductCode.isEmpty()) {
            return responses.notFound(
                locale == HelpLocale.VI
                    ? "Mã " + extractedCode.get() + " không được nhận diện là mã hàng để tra tồn kho."
                    : extractedCode.get() + " is not recognized as a product code for stock lookup.",
                scope.relatedModules(locale, "Inventory", "Products"),
                locale
            );
        }

        if (product.isEmpty()) {
            if (classifier.isAggregateCountQuestion(normalizedQuestion)) {
                long productCount = products.countByTenantIdAndDeletedAtIsNull(tenantId);
                int totalStock = stockItems.findByTenantId(tenantId).stream()
                    .mapToInt(item -> item.getQuantityOnHand() == null ? 0 : item.getQuantityOnHand())
                    .sum();

                return responses.response(
                    locale == HelpLocale.VI
                        ? "Hiện hệ thống đang theo dõi " + productCount + " mã hàng với tổng tồn kho " + totalStock + " đơn vị."
                        : "The system is tracking " + productCount + " product codes with " + totalStock + " total units on hand.",
                    List.of(
                        locale == HelpLocale.VI ? "Mở Kho hàng để xem tồn kho theo từng mã hàng." : "Open Inventory to review stock by product code.",
                        locale == HelpLocale.VI ? "Dùng ô tìm kiếm nếu bạn cần tra một mã hàng cụ thể." : "Use search when you need a specific product code.",
                        locale == HelpLocale.VI ? "Chỉ điều chỉnh tồn kho khi có quyền và có lý do nghiệp vụ rõ ràng." : "Only adjust stock with permission and a clear business reason."
                    ),
                    scope.relatedModules(locale, "Inventory", "Products"),
                    List.of(locale == HelpLocale.VI ? "Dữ liệu tồn kho chỉ trả về khi tài khoản có quyền kho." : "Stock data is only returned to accounts with inventory access."),
                    locale
                );
            }

            return responses.notFound(
                locale == HelpLocale.VI
                    ? "Mình chưa tìm thấy mã hàng trong câu hỏi. Hãy hỏi kèm mã như WATER-24."
                    : "I could not find a product code in the question. Try asking with a code like WATER-24.",
                scope.relatedModules(locale, "Inventory", "Products"),
                locale
            );
        }

        Product foundProduct = product.get();
        int quantity = stockItems.findByTenantIdAndProductId(tenantId, foundProduct.getId()).stream()
            .mapToInt(item -> item.getQuantityOnHand() == null ? 0 : item.getQuantityOnHand())
            .sum();

        return responses.response(
            locale == HelpLocale.VI
                ? foundProduct.getName() + " (" + foundProduct.getSku() + ") hiện còn " + quantity + " đơn vị trong kho."
                : foundProduct.getName() + " (" + foundProduct.getSku() + ") currently has " + quantity + " units on hand.",
            List.of(
                locale == HelpLocale.VI ? "Mở Kho hàng để xem chi tiết theo kho." : "Open Inventory to review details by warehouse.",
                locale == HelpLocale.VI ? "So sánh số tồn với mức tối thiểu: " + nullToZero(foundProduct.getMinStock()) + "." : "Compare on-hand stock with minimum stock: " + nullToZero(foundProduct.getMinStock()) + ".",
                locale == HelpLocale.VI ? "Nếu số tồn sai, chỉ điều chỉnh khi đã kiểm tra chứng từ hoặc kiểm kho." : "If stock is wrong, adjust only after checking documents or physical count."
            ),
            scope.relatedModules(locale, "Inventory", "Products"),
            List.of(locale == HelpLocale.VI ? "Không gửi dữ liệu tồn kho này sang dịch vụ AI bên ngoài; máy chủ đã tự tra theo quyền của bạn." : "This stock data was answered by the backend without sending database data to Gemini."),
            locale
        );
    }

    private int nullToZero(Integer value) {
        return value == null ? 0 : value;
    }
}
