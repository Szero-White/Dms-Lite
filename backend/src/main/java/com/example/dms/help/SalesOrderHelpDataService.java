package com.example.dms.help;

import com.example.dms.common.TenantContext;
import com.example.dms.sales.SalesOrder;
import com.example.dms.sales.SalesOrderRepository;
import com.example.dms.sales.SalesOrderStatus;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SalesOrderHelpDataService {

    private final SalesOrderRepository salesOrders;
    private final HelpDataQuestionClassifier classifier;
    private final HelpDataResponseFactory responses;

    public HelpAnswerResponse answer(
        String question,
        String normalizedQuestion,
        HelpPermissionScope scope,
        HelpLocale locale
    ) {
        if (!scope.canViewSalesData()) {
            return responses.blocked(scope, "Sales Orders", locale);
        }

        Long tenantId = TenantContext.tenantRequired();
        Optional<String> requestedOrderCode = HelpQuestionText.findProductOrOrderCode(question)
            .filter(classifier::isSalesOrderCode);
        Optional<SalesOrder> order = requestedOrderCode
            .flatMap(code -> salesOrders.findFirstByTenantIdAndCodeIgnoreCase(tenantId, code));

        if (requestedOrderCode.isPresent() && order.isEmpty()) {
            return responses.notFound(
                locale == HelpLocale.VI
                    ? "Mình không tìm thấy đơn " + requestedOrderCode.get() + " trong doanh nghiệp hiện tại."
                    : "I could not find order " + requestedOrderCode.get() + " in the current tenant.",
                scope.relatedModules(locale, "Sales Orders"),
                locale
            );
        }

        if (order.isEmpty()) {
            if (!classifier.isOrderCountQuestion(normalizedQuestion)) {
                return responses.notFound(
                    locale == HelpLocale.VI
                        ? "Hãy hỏi kèm mã đơn như SO-20260906-0002 nếu bạn cần trạng thái hoặc số liệu của một đơn cụ thể."
                        : "Include an order code such as SO-20260906-0002 when asking for one order's status or figures.",
                    scope.relatedModules(locale, "Sales Orders"),
                    locale
                );
            }

            long count = salesOrders.countByTenantId(tenantId);
            return responses.response(
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
        boolean asksFinance = HelpQuestionText.containsAny(
            normalizedQuestion,
            "tien", "tong", "gia tri", "da thu", "con phai thu", "phai thu", "doanh thu", "cong no",
            "paid", "collected", "remaining", "receivable", "debt", "revenue", "amount"
        );
        if (asksFinance && !scope.canViewOrderFinancials()) {
            return responses.blocked(scope, "Sales order finance", locale);
        }

        String financeText = asksFinance ? salesOrderFinanceText(foundOrder, locale) : "";

        return responses.response(
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
                ? " Tổng đơn " + responses.money(totalAmount, locale)
                    + ". Khoản phải thu thực tế chưa phát sinh; giá trị đơn hiện chỉ được dùng để kiểm tra hạn mức tín dụng dự kiến cho tới khi kho hoàn tất đơn."
                : " Order total " + responses.money(totalAmount, locale)
                    + ". No actual receivable has been recognized yet; this is projected credit exposure until warehouse fulfillment.";
        }

        if (salesOrder.getStatus() == SalesOrderStatus.CANCELLED) {
            return locale == HelpLocale.VI
                ? " Tổng đơn " + responses.money(totalAmount, locale)
                    + ". Đơn đã hủy nên không phát sinh doanh thu hoặc khoản phải thu."
                : " Order total " + responses.money(totalAmount, locale)
                    + ". The order was cancelled, so it did not create recognized revenue or a receivable.";
        }

        return locale == HelpLocale.VI
            ? " Tổng đơn " + responses.money(totalAmount, locale)
                + ", đã thu " + responses.money(salesOrder.getPaidAmount(), locale)
                + ", còn phải thu " + responses.money(salesOrder.getDebtAmount(), locale) + "."
            : " Order total " + responses.money(totalAmount, locale)
                + ", collected " + responses.money(salesOrder.getPaidAmount(), locale)
                + ", remaining receivable " + responses.money(salesOrder.getDebtAmount(), locale) + ".";
    }
}
