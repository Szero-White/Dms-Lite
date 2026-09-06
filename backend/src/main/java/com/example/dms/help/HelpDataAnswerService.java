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
import com.example.dms.sales.SalesOrderStatus;
import com.example.dms.user.PermissionNames;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class HelpDataAnswerService {

    private static final BigDecimal ZERO = BigDecimal.ZERO;

    private static final Pattern CUSTOMER_MARKER = Pattern.compile(
        "(?iu)\\b(?:khách\\s+hàng|khach\\s+hang|customer)\\b"
    );

    private static final Pattern CUSTOMER_DEBT_SUFFIX = Pattern.compile(
        "(?iu)\\b(?:hiện\\s+(?:còn|tại)|hien\\s+(?:con|tai)|đang\\s+nợ|dang\\s+no|"
            + "còn\\s+nợ|con\\s+no|công\\s+nợ|cong\\s+no|nợ\\s+bao\\s+nhiêu|no\\s+bao\\s+nhieu|"
            + "bao\\s+nhiêu|bao\\s+nhieu|debt|receivable|balance|how\\s+much|current|"
            + "still\\s+owes?|owes?)\\b.*$"
    );

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

        Optional<String> code = extractCode(request.question());

        // A document number is a stronger signal than generic finance wording such as
        // "phai thu". Route SO-* questions to the sales-order lookup first so asking
        // about one order cannot accidentally become a tenant-wide debt query.
        if (isSalesOrderQuestion(normalizedQuestion, code)) {
            return Optional.of(orderAnswer(request.question(), normalizedQuestion, scope, locale));
        }
        if (isStockQuestion(normalizedQuestion, code)) {
            return Optional.of(stockAnswer(request.question(), normalizedQuestion, scope, locale));
        }
        if (isDebtQuestion(normalizedQuestion)) {
            return Optional.of(debtAnswer(request.question(), normalizedQuestion, scope, locale));
        }
        if (isOrderQuestion(normalizedQuestion)) {
            return Optional.of(orderAnswer(request.question(), normalizedQuestion, scope, locale));
        }
        if (isProductCountQuestion(normalizedQuestion)) {
            return Optional.of(productSummaryAnswer(scope, locale));
        }
        if (isCustomerCountQuestion(normalizedQuestion)) {
            return Optional.of(customerSummaryAnswer(scope, locale));
        }

        return Optional.empty();
    }

    private HelpAnswerResponse stockAnswer(String question, String normalizedQuestion, HelpPermissionScope scope, HelpLocale locale) {
        if (!scope.canViewInventoryData()) {
            return blocked(scope, "Inventory", locale);
        }

        Long tenantId = TenantContext.tenantRequired();
        Optional<String> extractedCode = extractCode(question);
        Optional<String> requestedProductCode = extractedCode.filter(this::isProductLikeCode);
        Optional<Product> product = requestedProductCode
            .flatMap(code -> products.findFirstByTenantIdAndDeletedAtIsNullAndSkuIgnoreCase(tenantId, code));

        if (requestedProductCode.isPresent() && product.isEmpty()) {
            return notFound(
                locale == HelpLocale.VI
                    ? "Mình không tìm thấy mã hàng " + requestedProductCode.get() + " trong doanh nghiệp hiện tại."
                    : "I could not find product code " + requestedProductCode.get() + " in the current tenant.",
                scope.relatedModules(locale, "Inventory", "Products"),
                locale
            );
        }

        if (extractedCode.isPresent() && requestedProductCode.isEmpty()) {
            return notFound(
                locale == HelpLocale.VI
                    ? "Mã " + extractedCode.get() + " không được nhận diện là mã hàng để tra tồn kho."
                    : extractedCode.get() + " is not recognized as a product code for stock lookup.",
                scope.relatedModules(locale, "Inventory", "Products"),
                locale
            );
        }

        if (product.isEmpty()) {
            if (isAggregateCountQuestion(normalizedQuestion)) {
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
                    scope.relatedModules(locale, "Inventory", "Products"),
                    List.of(locale == HelpLocale.VI ? "Dữ liệu tồn kho chỉ trả về khi tài khoản có quyền kho." : "Stock data is only returned to accounts with inventory access."),
                    locale
                );
            }

            return notFound(
                locale == HelpLocale.VI ? "Mình chưa tìm thấy mã hàng trong câu hỏi. Hãy hỏi kèm mã như WATER-24." : "I could not find a product code in the question. Try asking with a code like WATER-24.",
                scope.relatedModules(locale, "Inventory", "Products"),
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
            scope.relatedModules(locale, "Inventory", "Products"),
            List.of(locale == HelpLocale.VI ? "Không gửi dữ liệu tồn kho này sang dịch vụ AI bên ngoài; máy chủ đã tự tra theo quyền của bạn." : "This stock data was answered by the backend without sending database data to Gemini."),
            locale
        );
    }

    private HelpAnswerResponse debtAnswer(String question, String normalizedQuestion, HelpPermissionScope scope, HelpLocale locale) {
        if (!scope.canViewDebtData()) {
            return blocked(scope, "Payments/Debt", locale);
        }

        Long tenantId = TenantContext.tenantRequired();
        String keyword = extractCustomerKeyword(question);
        if (!keyword.isBlank()) {
            List<Customer> matches = customers.findByTenantIdAndDeletedAtIsNullAndNameContainingIgnoreCase(
                tenantId,
                keyword,
                PageRequest.of(0, 2)
            ).getContent();

            if (matches.size() == 1) {
                Customer customer = matches.get(0);
                BigDecimal balance = customerDebts.balance(tenantId, customer.getId());
                List<String> debtSteps = new ArrayList<>();
                debtSteps.add(locale == HelpLocale.VI
                    ? "Mở Khách hàng để xem hồ sơ và sao kê công nợ chi tiết."
                    : "Open Customers to review the profile and receivable statement.");
                if (scope.has(PermissionNames.PAYMENT_CREATE)) {
                    debtSteps.add(locale == HelpLocale.VI
                        ? "Kiểm tra sao kê trước khi ghi nhận thanh toán và chỉ ghi nhận khi tiền thực tế đã nhận."
                        : "Review the statement before recording payment and only post money actually received.");
                } else {
                    debtSteps.add(locale == HelpLocale.VI
                        ? "Nếu cần ghi nhận thanh toán, chuyển cho vai trò có quyền Thanh toán thay vì dùng tài khoản khác."
                        : "If payment must be recorded, hand it to a role with payment permission instead of using another account.");
                }

                return response(
                    locale == HelpLocale.VI
                        ? "Khách hàng " + customer.getName() + " hiện còn công nợ " + money(balance, locale) + "."
                        : customer.getName() + " currently has " + money(balance, locale) + " in receivables.",
                    debtSteps,
                    scope.relatedModules(locale, "Payments", "Customers"),
                    List.of(locale == HelpLocale.VI ? "Công nợ là dữ liệu nhạy cảm và chỉ trả về cho tài khoản có quyền tài chính." : "Receivables are sensitive and only returned to finance-authorized accounts."),
                    locale
                );
            }

            return notFound(
                locale == HelpLocale.VI
                    ? "Mình chưa xác định được duy nhất khách hàng từ câu hỏi. Hãy dùng đúng tên khách hàng như trên màn Khách hàng."
                    : "I could not resolve exactly one customer from the question. Use the customer name shown on the Customers screen.",
                scope.relatedModules(locale, "Customers", "Payments"),
                locale
            );
        }

        if (!isAggregateDebtQuestion(normalizedQuestion)) {
            return notFound(
                locale == HelpLocale.VI
                    ? "Câu hỏi công nợ chưa đủ rõ. Hãy hỏi “Tổng công nợ hiện tại là bao nhiêu?” hoặc “Khách hàng <tên> còn nợ bao nhiêu?”."
                    : "The receivable question is ambiguous. Ask either “What is the current total receivable?” or “How much does customer <name> owe?”.",
                scope.relatedModules(locale, "Customers", "Payments"),
                locale
            );
        }

        BigDecimal total = customerDebts.totalReceivable(tenantId);
        List<String> totalDebtSteps = new ArrayList<>();
        if (scope.has(PermissionNames.PAYMENT_CREATE) && scope.canUseReports()) {
            totalDebtSteps.add(locale == HelpLocale.VI
                ? "Mở Thanh toán hoặc Báo cáo để đối soát chi tiết."
                : "Open Payments or Reports for detailed reconciliation.");
        } else if (scope.has(PermissionNames.PAYMENT_CREATE)) {
            totalDebtSteps.add(locale == HelpLocale.VI
                ? "Mở Thanh toán để đối soát các khoản phải thu trong phạm vi được cấp."
                : "Open Payments to reconcile receivables within your assigned scope.");
        } else if (scope.canUseReports()) {
            totalDebtSteps.add(locale == HelpLocale.VI
                ? "Mở Báo cáo để đối soát công nợ trong phạm vi được cấp."
                : "Open Reports to reconcile receivables within your assigned scope.");
        } else {
            totalDebtSteps.add(locale == HelpLocale.VI
                ? "Mở Khách hàng và sao kê công nợ để đối soát trong phạm vi được cấp."
                : "Open Customers and receivable statements to reconcile within your assigned scope.");
        }
        totalDebtSteps.add(locale == HelpLocale.VI
            ? "Dùng tên khách hàng cụ thể nếu bạn muốn hỏi công nợ của một khách hàng."
            : "Use a specific customer name if you want one customer's balance.");
        totalDebtSteps.add(locale == HelpLocale.VI
            ? "Không chia sẻ công nợ cho vai trò không liên quan."
            : "Do not share receivables with unrelated roles.");

        return response(
            locale == HelpLocale.VI
                ? "Tổng công nợ phải thu hiện tại là " + money(total, locale) + "."
                : "Current total receivables are " + money(total, locale) + ".",
            totalDebtSteps,
            scope.relatedModules(locale, "Payments", "Customers", "Reports"),
            List.of(locale == HelpLocale.VI ? "Máy chủ tự tra công nợ theo quyền, không gửi số liệu này sang dịch vụ AI bên ngoài." : "The backend looked up receivables by permission without sending these numbers to Gemini."),
            locale
        );
    }

    private HelpAnswerResponse orderAnswer(String question, String normalizedQuestion, HelpPermissionScope scope, HelpLocale locale) {
        if (!scope.canViewSalesData()) {
            return blocked(scope, "Sales Orders", locale);
        }

        Long tenantId = TenantContext.tenantRequired();
        Optional<String> requestedOrderCode = extractCode(question).filter(this::isSalesOrderCode);
        Optional<SalesOrder> order = requestedOrderCode
            .flatMap(code -> salesOrders.findFirstByTenantIdAndCodeIgnoreCase(tenantId, code));

        if (requestedOrderCode.isPresent() && order.isEmpty()) {
            return notFound(
                locale == HelpLocale.VI
                    ? "Mình không tìm thấy đơn " + requestedOrderCode.get() + " trong doanh nghiệp hiện tại."
                    : "I could not find order " + requestedOrderCode.get() + " in the current tenant.",
                scope.relatedModules(locale, "Sales Orders"),
                locale
            );
        }

        if (order.isEmpty()) {
            if (!isOrderCountQuestion(normalizedQuestion)) {
                return notFound(
                    locale == HelpLocale.VI
                        ? "Hãy hỏi kèm mã đơn như SO-20260906-0002 nếu bạn cần trạng thái hoặc số liệu của một đơn cụ thể."
                        : "Include an order code such as SO-20260906-0002 when asking for one order's status or figures.",
                    scope.relatedModules(locale, "Sales Orders"),
                    locale
                );
            }

            long count = salesOrders.countByTenantId(tenantId);
            return response(
                locale == HelpLocale.VI
                    ? "Hiện hệ thống có " + count + " đơn bán hàng trong doanh nghiệp này."
                    : "This tenant currently has " + count + " sales orders.",
                List.of(
                    locale == HelpLocale.VI ? "Mở Đơn bán hàng để lọc theo trạng thái hoặc khách hàng." : "Open Sales Orders to filter by status or customer.",
                    locale == HelpLocale.VI ? "Hỏi kèm mã đơn nếu bạn muốn kiểm tra một đơn cụ thể." : "Ask with an order code if you need one specific order.",
                    locale == HelpLocale.VI ? "Thông tin tiền/công nợ của đơn chỉ hiển thị khi bạn có quyền tài chính phù hợp." : "Order financial fields are only shown with the right finance permissions."
                ),
                scope.relatedModules(locale, "Sales Orders"),
                List.of(locale == HelpLocale.VI ? "Máy chủ tự trả lời số lượng đơn theo quyền bán hàng." : "The backend answered order counts by sales permission."),
                locale
            );
        }

        SalesOrder foundOrder = order.get();
        boolean asksFinance = containsAny(
            normalizedQuestion,
            "tien", "tong", "gia tri", "da thu", "con phai thu", "phai thu", "doanh thu", "cong no",
            "paid", "collected", "remaining", "receivable", "debt", "revenue", "amount"
        );
        if (asksFinance && !scope.canViewOrderFinancials()) {
            return blocked(scope, "Sales order finance", locale);
        }

        String financeText = asksFinance
            ? salesOrderFinanceText(foundOrder, locale)
            : "";

        return response(
            locale == HelpLocale.VI
                ? "Đơn " + foundOrder.getCode() + " đang ở trạng thái " + HelpDisplayNames.salesOrderStatus(foundOrder.getStatus().name(), locale) + "." + financeText
                : "Order " + foundOrder.getCode() + " is currently " + HelpDisplayNames.salesOrderStatus(foundOrder.getStatus().name(), locale) + "." + financeText,
            List.of(
                locale == HelpLocale.VI ? "Mở Đơn bán hàng để xem chi tiết dòng hàng." : "Open Sales Orders to view line item details.",
                locale == HelpLocale.VI ? "Chỉ xác nhận/hủy đơn nếu tài khoản có quyền thao tác tương ứng." : "Confirm or cancel only if your account has the matching action permission.",
                locale == HelpLocale.VI ? "Nếu cần xem tiền/công nợ, tài khoản phải có quyền tài chính." : "Viewing payment/debt details requires finance permission."
            ),
            scope.relatedModules(locale, "Sales Orders"),
            List.of(locale == HelpLocale.VI ? "Dữ liệu đơn hàng được máy chủ tra trực tiếp theo doanh nghiệp và quyền." : "Order data was looked up directly by tenant and permission."),
            locale
        );
    }

    private String salesOrderFinanceText(SalesOrder salesOrder, HelpLocale locale) {
        BigDecimal totalAmount = salesOrder.getTotalAmount();

        if (salesOrder.getStatus() == SalesOrderStatus.DRAFT) {
            return locale == HelpLocale.VI
                ? " Tổng đơn " + money(totalAmount, locale)
                    + ". Khoản phải thu thực tế chưa phát sinh; giá trị đơn hiện chỉ được dùng để kiểm tra hạn mức tín dụng dự kiến cho tới khi kho hoàn tất đơn."
                : " Order total " + money(totalAmount, locale)
                    + ". No actual receivable has been recognized yet; this is projected credit exposure until warehouse fulfillment.";
        }

        if (salesOrder.getStatus() == SalesOrderStatus.CANCELLED) {
            return locale == HelpLocale.VI
                ? " Tổng đơn " + money(totalAmount, locale)
                    + ". Đơn đã hủy nên không phát sinh doanh thu hoặc khoản phải thu."
                : " Order total " + money(totalAmount, locale)
                    + ". The order was cancelled, so it did not create recognized revenue or a receivable.";
        }

        return locale == HelpLocale.VI
            ? " Tổng đơn " + money(totalAmount, locale)
                + ", đã thu " + money(salesOrder.getPaidAmount(), locale)
                + ", còn phải thu " + money(salesOrder.getDebtAmount(), locale) + "."
            : " Order total " + money(totalAmount, locale)
                + ", collected " + money(salesOrder.getPaidAmount(), locale)
                + ", remaining receivable " + money(salesOrder.getDebtAmount(), locale) + ".";
    }

    private HelpAnswerResponse productSummaryAnswer(HelpPermissionScope scope, HelpLocale locale) {
        if (!scope.canViewProductData()) {
            return blocked(scope, "Products", locale);
        }

        long count = products.countByTenantIdAndDeletedAtIsNull(TenantContext.tenantRequired());
        return response(
            locale == HelpLocale.VI ? "Hiện có " + count + " mã hàng đang được quản lý." : "There are " + count + " active product codes being managed.",
            List.of(
                locale == HelpLocale.VI ? "Mở Sản phẩm để tìm theo mã hàng, tên hoặc mã vạch." : "Open Products to search by product code, name or barcode.",
                locale == HelpLocale.VI ? "Dữ liệu giá vốn/giá bán nên chỉ mở cho vai trò liên quan." : "Cost and selling price should stay limited to relevant roles.",
                scope.canViewInventoryData()
                    ? (locale == HelpLocale.VI ? "Dùng Kho hàng nếu bạn cần xem số tồn." : "Use Inventory if you need stock quantities.")
                    : (locale == HelpLocale.VI ? "Nếu cần số tồn, nhờ vai trò có quyền Kho hàng kiểm tra." : "If stock quantities are needed, ask a role with inventory access to check them.")
            ),
            scope.relatedModules(locale, "Products"),
            List.of(locale == HelpLocale.VI ? "Máy chủ tự tra số lượng sản phẩm, không gửi dữ liệu cơ sở dữ liệu sang dịch vụ AI bên ngoài." : "The backend counted products without sending DB data to Gemini."),
            locale
        );
    }

    private HelpAnswerResponse customerSummaryAnswer(HelpPermissionScope scope, HelpLocale locale) {
        if (!scope.canViewCustomerData()) {
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
            scope.relatedModules(locale, "Customers"),
            List.of(locale == HelpLocale.VI ? "Máy chủ tự tra số lượng khách hàng theo quyền." : "The backend counted customers by permission."),
            locale
        );
    }

    private HelpAnswerResponse blocked(HelpPermissionScope scope, String requestedArea, HelpLocale locale) {
        String requestedAreaLabel = HelpDisplayNames.module(requestedArea, locale);
        return response(
            locale == HelpLocale.VI
                ? "Mình không thể tra dữ liệu " + requestedAreaLabel + " vì tài khoản hiện tại chưa có quyền phù hợp."
                : "I cannot look up " + requestedArea + " data because this account does not have the required permission.",
            List.of(
                locale == HelpLocale.VI ? "Chỉ dùng các màn hình đang hiển thị với tài khoản của bạn." : "Use only the screens visible to your account.",
                locale == HelpLocale.VI ? "Nhờ Chủ doanh nghiệp cấp thêm quyền nếu nhiệm vụ này thuộc công việc của bạn." : "Ask Owner to grant access if this task belongs to your job.",
                locale == HelpLocale.VI ? "Không dùng tài khoản người khác để xem dữ liệu bị giới hạn." : "Do not use another account to view restricted data."
            ),
            scope.visibleModules(locale),
            List.of(locale == HelpLocale.VI ? "Câu hỏi dữ liệu thật được chặn ở máy chủ trước khi gọi dịch vụ AI bên ngoài." : "Real data questions are blocked in the backend before any external AI call."),
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
            List.of(locale == HelpLocale.VI ? "Không tìm thấy bản ghi phù hợp trong doanh nghiệp hiện tại." : "No matching record was found in the current tenant."),
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

    private boolean isSalesOrderQuestion(String normalizedQuestion, Optional<String> code) {
        return code.filter(this::isSalesOrderCode).isPresent()
            && containsAny(
                normalizedQuestion,
                "trang thai", "status", "bao nhieu", "co may", "how much", "how many", "hien tai", "current",
                "tien", "tong tien", "tong gia tri", "gia tri", "da thu", "con phai thu", "phai thu", "cong no",
                "paid", "collected", "remaining", "receivable", "debt", "amount", "value"
            );
    }

    private boolean isStockQuestion(String normalizedQuestion, Optional<String> code) {
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

    private boolean isDebtQuestion(String normalizedQuestion) {
        return containsAny(
            normalizedQuestion,
            "cong no", "no bao nhieu", "phai thu", "debt", "receivable", "receivable balance", "owes"
        );
    }

    private boolean isOrderQuestion(String normalizedQuestion) {
        return containsAny(
            normalizedQuestion,
            "don hang", "don ban hang", "sales order", "order", "trang thai don", "order status"
        );
    }

    private boolean isProductCountQuestion(String normalizedQuestion) {
        return containsAny(normalizedQuestion, "san pham", "product", "ma hang", "sku")
            && isAggregateCountQuestion(normalizedQuestion);
    }

    private boolean isCustomerCountQuestion(String normalizedQuestion) {
        return containsAny(normalizedQuestion, "khach hang", "customer")
            && isAggregateCountQuestion(normalizedQuestion);
    }

    private boolean isOrderCountQuestion(String normalizedQuestion) {
        return isOrderQuestion(normalizedQuestion) && isAggregateCountQuestion(normalizedQuestion);
    }

    private boolean isAggregateDebtQuestion(String normalizedQuestion) {
        return containsAny(
            normalizedQuestion,
            "tong cong no", "tong no", "tong phai thu", "toan bo cong no", "toan cong ty", "cua cong ty",
            "total receivable", "total receivables", "total debt", "overall receivable", "company receivable"
        );
    }

    private boolean isAggregateCountQuestion(String normalizedQuestion) {
        return containsAny(
            normalizedQuestion,
            "bao nhieu", "co may", "so luong", "tong so", "how many", "count", "total number", "total"
        );
    }

    private boolean isSalesOrderCode(String code) {
        return hasPrefix(code, "SO-");
    }

    private boolean isProductLikeCode(String code) {
        return code != null
            && !hasPrefix(code, "SO-")
            && !hasPrefix(code, "INV-")
            && !hasPrefix(code, "PAY-");
    }

    private boolean hasPrefix(String value, String prefix) {
        return value != null && value.regionMatches(true, 0, prefix, 0, prefix.length());
    }

    private boolean looksLikeDataQuestion(String normalizedQuestion) {
        return containsAny(
            normalizedQuestion,
            "bao nhieu", "co may", "con bao nhieu", "con lai", "hien co", "dang co", "trang thai", "status",
            "ton kho", "stock level", "cong no", "phai thu", "doanh thu", "so luong", "gia tri", "da thu",
            "how many", "how much", "count", "current", "available", "remaining", "receivable balance"
        );
    }

    private Optional<String> extractCode(String question) {
        return HelpQuestionText.findProductOrOrderCode(question);
    }

    private String extractCustomerKeyword(String question) {
        if (question == null || question.isBlank()) {
            return "";
        }

        Matcher marker = CUSTOMER_MARKER.matcher(question);
        if (!marker.find()) {
            return "";
        }

        String value = question.substring(marker.end()).trim();
        value = CUSTOMER_DEBT_SUFFIX.matcher(value).replaceFirst("").trim();
        value = value.replaceAll("[?!.:,;]+$", "").trim();

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
