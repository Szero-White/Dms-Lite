package com.example.dms.help;

import com.example.dms.user.PermissionNames;
import java.util.ArrayList;
import java.util.List;
import static com.example.dms.help.HelpWorkflowResponses.response;

final class SalesWorkflowKnowledge {

    public HelpAnswerResponse salesAnswer(HelpPermissionScope scope, HelpLocale locale) {
        if (locale == HelpLocale.VI) {
            List<String> steps = new ArrayList<>();
            if (scope.has(PermissionNames.CUSTOMER_VIEW)) {
                steps.add("Kiểm tra trạng thái khách hàng và điều khoản công nợ trước khi tạo đơn bán.");
            } else {
                steps.add("Kiểm tra các thông tin đơn hàng đang được phép xem; trạng thái khách hàng và hạn mức sẽ được máy chủ kiểm tra khi hoàn tất đơn.");
            }
            if (scope.has(PermissionNames.SALES_ORDER_CREATE)) {
                steps.add(scope.has(PermissionNames.SALES_ORDER_VIEW)
                    ? "Mở Đơn bán hàng và chọn Tạo đơn mới."
                    : "Dùng Tạo nhanh để mở Tạo đơn bán hàng mới.");
                steps.add("Chọn khách hàng, sản phẩm, số lượng và kho xuất, sau đó kiểm tra lại trước khi lưu.");
            } else {
                steps.add("Bạn có thể xem đơn bán được phép, nhưng tạo đơn cần quyền Tạo đơn bán hàng.");
            }
            if (scope.has(PermissionNames.SALES_ORDER_CONFIRM)) {
                steps.add("Chỉ xác nhận và hoàn tất đơn nháp khi khách hàng, tồn kho và giá đã đúng; thao tác này chuyển đơn sang trạng thái Hoàn tất.");
            }
            steps.add("Theo dõi vòng đời hiện tại: Nháp, Hoàn tất hoặc Đã hủy; hệ thống không lưu trạng thái Xác nhận riêng.");

            return response(
                "Quy trình bán hàng giúp đơn hàng chính xác, tồn kho khớp và công nợ rõ ràng.",
                steps,
                scope.relatedModules(locale, "Sales Orders", "Customers", "Inventory", "Payments"),
                List.of(
                    "Không xác nhận đơn khi thiếu hoặc sai dữ liệu khách hàng/sản phẩm.",
                    "Đơn sai nên hủy bằng thao tác được phép thay vì che giấu lỗi."
                ),
                locale
            );
        }

        List<String> steps = new ArrayList<>();
        if (scope.has(PermissionNames.CUSTOMER_VIEW)) {
            steps.add("Check customer status and credit terms before creating a sales order.");
        } else {
            steps.add("Review the order information available to you; customer status and credit limit are validated by the server during fulfillment.");
        }
        if (scope.has(PermissionNames.SALES_ORDER_CREATE)) {
            steps.add(scope.has(PermissionNames.SALES_ORDER_VIEW)
                ? "Open Sales Orders and choose New Order."
                : "Use Quick Create to open a new sales order.");
            steps.add("Select customer, products, quantities and warehouse, then review totals before saving.");
        } else {
            steps.add("You can review assigned sales orders, but creating orders requires SALES_ORDER_CREATE.");
        }
        if (scope.has(PermissionNames.SALES_ORDER_CONFIRM)) {
            steps.add("Confirm/fulfill a draft only after customer, stock and price are correct; this moves it to Completed.");
        }
        steps.add("Track the current lifecycle: Draft, Completed or Cancelled; Confirmed is not stored as a separate status.");

        return response(
            "Sales workflow keeps orders accurate, stock aligned and receivables clear.",
            steps,
            scope.relatedModules(locale, "Sales Orders", "Customers", "Inventory", "Payments"),
            List.of(
                "Do not confirm an order with missing or incorrect customer/product data.",
                "Cancel incorrect orders through the approved action instead of hiding mistakes."
            ),
            locale
        );
    }

    public HelpAnswerResponse invoiceAnswer(HelpPermissionScope scope, HelpLocale locale) {
        if (locale == HelpLocale.VI) {
            List<String> steps = new ArrayList<>();
            steps.add("Khi một đơn bán hàng Hoàn tất được thu đủ, hệ thống tự tạo một hóa đơn Nháp cho đúng đơn đó; không cần thao tác Tạo hóa đơn thủ công.");
            if (scope.has(PermissionNames.INVOICE_ISSUE)) {
                steps.add("Kiểm tra khách hàng, số tiền và chứng từ rồi phát hành hóa đơn để tải PDF.");
            }
            if (scope.canUsePayments()) {
                steps.add("Thanh toán vẫn ghi theo từng đơn; lần thu cuối đưa còn phải thu về 0 và tạo hóa đơn trong cùng giao dịch.");
            } else {
                steps.add("Tiền đã thu và còn phải thu lấy từ công nợ của đơn bán hàng; khoản thu do vai trò có quyền Thanh toán ghi nhận.");
            }

            return response(
                "Hóa đơn là chứng từ bán hàng tự sinh khi đơn đã thu đủ, còn thanh toán và công nợ vẫn dùng quy trình tài chính hiện tại.",
                steps,
                scope.relatedModules(locale, "Invoices", "Sales Orders", "Payments"),
                List.of(
                    "Không dùng hóa đơn để tạo hoặc điều chỉnh công nợ lần thứ hai.",
                    "Không tạo hóa đơn thủ công hoặc nhân bản hóa đơn cho cùng một đơn bán hàng."
                ),
                locale
            );
        }

        List<String> steps = new ArrayList<>();
        steps.add("When a Completed sales order becomes fully paid, DMS automatically creates one Draft invoice for that order; there is no manual Create invoice step.");
        if (scope.has(PermissionNames.INVOICE_ISSUE)) {
            steps.add("Review the customer, amount and document, then issue the invoice to enable PDF download.");
        }
        if (scope.canUsePayments()) {
            steps.add("Payments remain order-specific; the final collection sets remaining debt to zero and creates the invoice in the same transaction.");
        } else {
            steps.add("Collected and remaining amounts come from the linked sales-order receivable; payment posting is handled by a role with payment permission.");
        }

        return response(
            "An invoice is generated automatically when a completed order is fully paid, while payments and receivables remain in the canonical finance workflow.",
            steps,
            scope.relatedModules(locale, "Invoices", "Sales Orders", "Payments"),
            List.of(
                "Do not use invoices to create or adjust receivables a second time.",
                "Do not manually create or duplicate an invoice for the same sales order."
            ),
            locale
        );
    }

}
