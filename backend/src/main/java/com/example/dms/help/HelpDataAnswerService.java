package com.example.dms.help;

import com.example.dms.common.TenantContext;
import com.example.dms.customer.Customer;
import com.example.dms.customer.CustomerRepository;
import com.example.dms.debt.CustomerDebtRepository;
import com.example.dms.inventory.StockItemRepository;
import com.example.dms.product.Product;
import com.example.dms.product.ProductRepository;
import com.example.dms.sales.SalesOrder;
import com.example.dms.sales.SalesOrderRepository;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class HelpDataAnswerService {

    private static final BigDecimal ZERO = BigDecimal.ZERO;

    private final ProductRepository products;

    private final StockItemRepository stockItems;

    private final CustomerRepository customers;

    private final SalesOrderRepository salesOrders;

    private final CustomerDebtRepository customerDebts;

    @Transactional(readOnly = true)
    public Optional<HelpAnswerResponse> answer(HelpAskRequest request, HelpPermissionScope scope, HelpLocale locale) {
        String normalizedQuestion = normalize(request.question());
        if (!looksLikeDataQuestion(normalizedQuestion)) {
            return Optional.empty();
        }

        if (containsAny(normalizedQuestion, "ton kho", "stock", "con hang", "so luong", "quantity")) {
            return Optional.of(stockAnswer(request.question(), normalizedQuestion, scope, locale));
        }
        if (containsAny(normalizedQuestion, "cong no", "no bao nhieu", "debt", "receivable", "phai thu")) {
            return Optional.of(debtAnswer(request.question(), normalizedQuestion, scope, locale));
        }
        if (containsAny(normalizedQuestion, "don hang", "order", "trang thai don", "status")) {
            return Optional.of(orderAnswer(request.question(), normalizedQuestion, scope, locale));
        }
        if (containsAny(normalizedQuestion, "san pham", "product", "ma hang", "sku")) {
            return Optional.of(productSummaryAnswer(scope, locale));
        }
        if (containsAny(normalizedQuestion, "khach hang", "customer")) {
            return Optional.of(customerSummaryAnswer(scope, locale));
        }

        return Optional.empty();
    }

    private HelpAnswerResponse stockAnswer(String question, String normalizedQuestion, HelpPermissionScope scope, HelpLocale locale) {
        if (!scope.canUseInventory()) {
            return blocked(scope, "Inventory", locale);
        }

        Long tenantId = TenantContext.tenantRequired();
        Optional<Product> product = extractCode(question)
            .flatMap(code -> products.findFirstByTenantIdAndDeletedAtIsNullAndSkuIgnoreCase(tenantId, code));

        if (product.isEmpty()) {
            if (containsAny(normalizedQuestion, "bao nhieu", "how many", "total")) {
                long productCount = products.countByTenantIdAndDeletedAtIsNull(tenantId);
                int totalStock = stockItems.findByTenantId(tenantId).stream()
                    .mapToInt(item -> item.getQuantityOnHand() == null ? 0 : item.getQuantityOnHand())
                    .sum();

                return response(
                    locale == HelpLocale.VI
                        ? "Hiện hệ thống đang theo dõi " + productCount + " mã hàng với tổng tồn kho " + totalStock + " đơn vị."
                        : "The system is tracking " + productCount + " product codes with " + totalStock + " total units on hand.",
                    List.of(
                        locale == HelpLocale.VI ? "Mở Kho hàng để xem tồn kho theo từng mã hàng." : "Open Inventory to review stock by product code.",
                        locale == HelpLocale.VI ? "Dùng ô tìm kiếm nếu bạn cần tra một mã hàng cụ thể." : "Use search when you need a specific product code.",
                        locale == HelpLocale.VI ? "Chỉ điều chỉnh tồn kho khi có quyền và có lý do nghiệp vụ rõ ràng." : "Only adjust stock with permission and a clear business reason."
                    ),
                    List.of("Inventory", "Products"),
                    List.of(locale == HelpLocale.VI ? "Dữ liệu tồn kho chỉ trả về khi tài khoản có quyền kho." : "Stock data is only returned to accounts with inventory access."),
                    locale
                );
            }

            return notFound(
                locale == HelpLocale.VI ? "Mình chưa tìm thấy mã hàng trong câu hỏi. Hãy hỏi kèm mã như WATER-24." : "I could not find a product code in the question. Try asking with a code like WATER-24.",
                List.of("Inventory", "Products"),
                locale
            );
        }

        Product foundProduct = product.get();
        int quantity = stockItems.findByTenantIdAndProductId(tenantId, foundProduct.getId()).stream()
            .mapToInt(item -> item.getQuantityOnHand() == null ? 0 : item.getQuantityOnHand())
            .sum();

        return response(
            locale == HelpLocale.VI
                ? foundProduct.getName() + " (" + foundProduct.getSku() + ") hiện còn " + quantity + " đơn vị trong kho."
                : foundProduct.getName() + " (" + foundProduct.getSku() + ") currently has " + quantity + " units on hand.",
            List.of(
                locale == HelpLocale.VI ? "Mở Kho hàng để xem chi tiết theo kho." : "Open Inventory to review details by warehouse.",
                locale == HelpLocale.VI ? "So sánh số tồn với mức tối thiểu: " + nullToZero(foundProduct.getMinStock()) + "." : "Compare on-hand stock with minimum stock: " + nullToZero(foundProduct.getMinStock()) + ".",
                locale == HelpLocale.VI ? "Nếu số tồn sai, chỉ điều chỉnh khi đã kiểm tra chứng từ hoặc kiểm kho." : "If stock is wrong, adjust only after checking documents or physical count."
            ),
            List.of("Inventory", "Products"),
            List.of(locale == HelpLocale.VI ? "Không gửi dữ liệu tồn kho này ra Gemini; backend đã tự tra theo quyền của bạn." : "This stock data was answered by the backend without sending database data to Gemini."),
            locale
        );
    }

    private HelpAnswerResponse debtAnswer(String question, String normalizedQuestion, HelpPermissionScope scope, HelpLocale locale) {
        if (!scope.canUseFinance()) {
            return blocked(scope, "Payments/Debt", locale);
        }

        Long tenantId = TenantContext.tenantRequired();
        String keyword = extractCustomerKeyword(question, normalizedQuestion);
        if (!keyword.isBlank()) {
            List<Customer> matches = customers.findByTenantIdAndDeletedAtIsNullAndNameContainingIgnoreCase(
                tenantId,
                keyword,
                PageRequest.of(0, 2)
            ).getContent();

            if (matches.size() == 1) {
                Customer customer = matches.get(0);
                BigDecimal balance = customerDebts.balance(tenantId, customer.getId());
                return response(
                    locale == HelpLocale.VI
                        ? "Khách hàng " + customer.getName() + " hiện còn công nợ " + money(balance, locale) + "."
                        : customer.getName() + " currently has " + money(balance, locale) + " in receivables.",
                    List.of(
                        locale == HelpLocale.VI ? "Mở Khách hàng để xem hồ sơ chi tiết." : "Open Customers to view the customer profile.",
                        locale == HelpLocale.VI ? "Kiểm tra sao kê công nợ trước khi ghi nhận thanh toán." : "Review the debt statement before recording payment.",
                        locale == HelpLocale.VI ? "Chỉ ghi nhận thanh toán khi tiền thực tế đã nhận." : "Record payment only when money is actually received."
                    ),
                    List.of("Payments", "Customers"),
                    List.of(locale == HelpLocale.VI ? "Công nợ là dữ liệu nhạy cảm và chỉ trả về cho tài khoản có quyền tài chính." : "Receivables are sensitive and only returned to finance-authorized accounts."),
                    locale
                );
            }
        }

        BigDecimal total = customerDebts.totalReceivable(tenantId);
        return response(
            locale == HelpLocale.VI
                ? "Tổng công nợ phải thu hiện tại là " + money(total, locale) + "."
                : "Current total receivables are " + money(total, locale) + ".",
            List.of(
                locale == HelpLocale.VI ? "Mở Thanh toán hoặc Báo cáo để đối soát chi tiết." : "Open Payments or Reports for detailed reconciliation.",
                locale == HelpLocale.VI ? "Dùng tên khách hàng cụ thể nếu bạn muốn hỏi công nợ của một khách hàng." : "Use a specific customer name if you want one customer's balance.",
                locale == HelpLocale.VI ? "Không chia sẻ công nợ cho vai trò không liên quan." : "Do not share receivables with unrelated roles."
            ),
            List.of("Payments", "Customers", "Reports"),
            List.of(locale == HelpLocale.VI ? "Backend tự tra công nợ theo quyền, không gửi số liệu này sang Gemini." : "The backend looked up receivables by permission without sending these numbers to Gemini."),
            locale
        );
    }

    private HelpAnswerResponse orderAnswer(String question, String normalizedQuestion, HelpPermissionScope scope, HelpLocale locale) {
        if (!scope.canUseSales()) {
            return blocked(scope, "Sales Orders", locale);
        }

        Long tenantId = TenantContext.tenantRequired();
        Optional<SalesOrder> order = extractCode(question)
            .flatMap(code -> salesOrders.findFirstByTenantIdAndCodeIgnoreCase(tenantId, code));

        if (order.isEmpty()) {
            long count = salesOrders.countByTenantId(tenantId);
            return response(
                locale == HelpLocale.VI
                    ? "Hiện hệ thống có " + count + " đơn bán hàng trong tenant này."
                    : "This tenant currently has " + count + " sales orders.",
                List.of(
                    locale == HelpLocale.VI ? "Mở Đơn bán hàng để lọc theo trạng thái hoặc khách hàng." : "Open Sales Orders to filter by status or customer.",
                    locale == HelpLocale.VI ? "Hỏi kèm mã đơn nếu bạn muốn kiểm tra một đơn cụ thể." : "Ask with an order code if you need one specific order.",
                    locale == HelpLocale.VI ? "Thông tin tiền/công nợ của đơn chỉ hiển thị khi bạn có quyền tài chính phù hợp." : "Order financial fields are only shown with the right finance permissions."
                ),
                List.of("Sales Orders"),
                List.of(locale == HelpLocale.VI ? "Backend tự trả lời số lượng đơn theo quyền sales." : "The backend answered order counts by sales permission."),
                locale
            );
        }

        SalesOrder foundOrder = order.get();
        boolean asksFinance = containsAny(normalizedQuestion, "tien", "tong", "doanh thu", "cong no", "paid", "debt", "revenue", "amount");
        if (asksFinance && !scope.canViewOrderFinancials()) {
            return blocked(scope, "Sales order finance", locale);
        }

        String financeText = asksFinance
            ? (locale == HelpLocale.VI
                ? " Tổng tiền " + money(foundOrder.getTotalAmount(), locale) + ", đã thanh toán " + money(foundOrder.getPaidAmount(), locale) + ", công nợ " + money(foundOrder.getDebtAmount(), locale) + "."
                : " Total " + money(foundOrder.getTotalAmount(), locale) + ", paid " + money(foundOrder.getPaidAmount(), locale) + ", debt " + money(foundOrder.getDebtAmount(), locale) + ".")
            : "";

        return response(
            locale == HelpLocale.VI
                ? "Đơn " + foundOrder.getCode() + " đang ở trạng thái " + foundOrder.getStatus() + "." + financeText
                : "Order " + foundOrder.getCode() + " is currently " + foundOrder.getStatus() + "." + financeText,
            List.of(
                locale == HelpLocale.VI ? "Mở Đơn bán hàng để xem chi tiết dòng hàng." : "Open Sales Orders to view line item details.",
                locale == HelpLocale.VI ? "Chỉ xác nhận/hủy đơn nếu tài khoản có quyền thao tác tương ứng." : "Confirm or cancel only if your account has the matching action permission.",
                locale == HelpLocale.VI ? "Nếu cần xem tiền/công nợ, tài khoản phải có quyền tài chính." : "Viewing payment/debt details requires finance permission."
            ),
            List.of("Sales Orders"),
            List.of(locale == HelpLocale.VI ? "Dữ liệu đơn hàng được backend tra trực tiếp theo tenant và quyền." : "Order data was looked up directly by tenant and permission."),
            locale
        );
    }

    private HelpAnswerResponse productSummaryAnswer(HelpPermissionScope scope, HelpLocale locale) {
        if (!scope.canUseProducts()) {
            return blocked(scope, "Products", locale);
        }

        long count = products.countByTenantIdAndDeletedAtIsNull(TenantContext.tenantRequired());
        return response(
            locale == HelpLocale.VI ? "Hiện có " + count + " mã hàng đang được quản lý." : "There are " + count + " active product codes being managed.",
            List.of(
                locale == HelpLocale.VI ? "Mở Sản phẩm để tìm theo mã hàng, tên hoặc mã vạch." : "Open Products to search by product code, name or barcode.",
                locale == HelpLocale.VI ? "Dữ liệu giá vốn/giá bán nên chỉ mở cho vai trò liên quan." : "Cost and selling price should stay limited to relevant roles.",
                locale == HelpLocale.VI ? "Dùng Kho hàng nếu bạn cần xem số tồn." : "Use Inventory if you need stock quantities."
            ),
            List.of("Products"),
            List.of(locale == HelpLocale.VI ? "Backend tự tra số lượng sản phẩm, không gửi DB sang Gemini." : "The backend counted products without sending DB data to Gemini."),
            locale
        );
    }

    private HelpAnswerResponse customerSummaryAnswer(HelpPermissionScope scope, HelpLocale locale) {
        if (!scope.canUseCustomers()) {
            return blocked(scope, "Customers", locale);
        }

        long count = customers.countByTenantIdAndDeletedAtIsNull(TenantContext.tenantRequired());
        return response(
            locale == HelpLocale.VI ? "Hiện có " + count + " khách hàng đang được quản lý." : "There are " + count + " active customers being managed.",
            List.of(
                locale == HelpLocale.VI ? "Mở Khách hàng để tìm theo tên, số điện thoại hoặc địa chỉ." : "Open Customers to search by name, phone or address.",
                locale == HelpLocale.VI ? "Kiểm tra hạn mức và điều khoản công nợ trước khi bán chịu." : "Check credit limits and terms before selling on debt.",
                locale == HelpLocale.VI ? "Không lưu dữ liệu cá nhân không cần thiết cho vận hành." : "Do not store personal data that is not needed for operations."
            ),
            List.of("Customers"),
            List.of(locale == HelpLocale.VI ? "Backend tự tra số lượng khách hàng theo quyền." : "The backend counted customers by permission."),
            locale
        );
    }

    private HelpAnswerResponse blocked(HelpPermissionScope scope, String requestedArea, HelpLocale locale) {
        return response(
            locale == HelpLocale.VI
                ? "Mình không thể tra dữ liệu " + requestedArea + " vì tài khoản hiện tại chưa có quyền phù hợp."
                : "I cannot look up " + requestedArea + " data because this account does not have the required permission.",
            List.of(
                locale == HelpLocale.VI ? "Chỉ dùng các màn hình đang hiển thị với tài khoản của bạn." : "Use only the screens visible to your account.",
                locale == HelpLocale.VI ? "Nhờ Owner cấp thêm quyền nếu nhiệm vụ này thuộc công việc của bạn." : "Ask Owner to grant access if this task belongs to your job.",
                locale == HelpLocale.VI ? "Không dùng tài khoản người khác để xem dữ liệu bị giới hạn." : "Do not use another account to view restricted data."
            ),
            scope.visibleModules(),
            List.of(locale == HelpLocale.VI ? "Câu hỏi dữ liệu thật được chặn ở backend trước khi gọi AI bên ngoài." : "Real data questions are blocked in the backend before any external AI call."),
            locale,
            true
        );
    }

    private HelpAnswerResponse notFound(String answer, List<String> modules, HelpLocale locale) {
        return response(
            answer,
            List.of(
                locale == HelpLocale.VI ? "Kiểm tra lại mã hàng, mã đơn hoặc tên khách hàng." : "Check the product code, order code or customer name again.",
                locale == HelpLocale.VI ? "Dùng ô tìm kiếm trong màn hình tương ứng để đối chiếu." : "Use search in the related screen to verify it.",
                locale == HelpLocale.VI ? "Nếu dữ liệu chưa có, hãy tạo hoặc yêu cầu người có quyền cập nhật." : "If the data is missing, create it or ask an authorized user to update it."
            ),
            modules,
            List.of(locale == HelpLocale.VI ? "Không tìm thấy bản ghi phù hợp trong tenant hiện tại." : "No matching record was found in the current tenant."),
            locale
        );
    }

    private HelpAnswerResponse response(String answer, List<String> steps, List<String> modules, List<String> guardrails, HelpLocale locale) {
        return response(answer, steps, modules, guardrails, locale, false);
    }

    private HelpAnswerResponse response(String answer, List<String> steps, List<String> modules, List<String> guardrails, HelpLocale locale, boolean blocked) {
        return new HelpAnswerResponse(
            answer,
            steps,
            modules,
            guardrails,
            locale == HelpLocale.VI ? "Câu trả lời này chỉ dựa trên quyền được cấp cho tài khoản hiện tại." : "This answer is limited to the current account permissions.",
            blocked
        );
    }

    private boolean looksLikeDataQuestion(String normalizedQuestion) {
        return containsAny(
            normalizedQuestion,
            "bao nhieu", "con bao nhieu", "con lai", "hien co", "dang co", "trang thai", "status",
            "ton kho", "cong no", "doanh thu", "so luong", "how many", "how much", "current", "available", "remaining"
        );
    }

    private Optional<String> extractCode(String question) {
        return HelpQuestionText.findProductOrOrderCode(question);
    }

    private String extractCustomerKeyword(String question, String normalizedQuestion) {
        int index = Math.max(normalizedQuestion.indexOf("khach hang"), normalizedQuestion.indexOf("customer"));
        if (index < 0) {
            return "";
        }

        String value = question.substring(Math.min(index + 10, question.length()))
            .replaceAll("(?i)cong no|no bao nhieu|debt|receivable|how much|bao nhieu|hien tai|current", "")
            .trim();

        return value.length() > 80 ? value.substring(0, 80) : value;
    }

    private String money(BigDecimal value, HelpLocale locale) {
        BigDecimal amount = value == null ? ZERO : value;
        NumberFormat formatter = NumberFormat.getCurrencyInstance(locale == HelpLocale.VI ? Locale.forLanguageTag("vi-VN") : Locale.US);
        return formatter.format(amount);
    }

    private int nullToZero(Integer value) {
        return value == null ? 0 : value;
    }

    private String normalize(String value) {
        return HelpQuestionText.normalize(value);
    }

    private boolean containsAny(String text, String... terms) {
        return HelpQuestionText.containsAny(text, terms);
    }
}
