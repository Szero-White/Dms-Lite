package com.example.dms.help;

import com.example.dms.user.PermissionNames;
import java.util.ArrayList;
import java.util.List;
import static com.example.dms.help.HelpWorkflowResponses.response;

final class FinanceWorkflowKnowledge {

    public HelpAnswerResponse financeAnswer(HelpPermissionScope scope, HelpLocale locale) {
        if (locale == HelpLocale.VI) {
            List<String> steps = new ArrayList<>();
            steps.add("Kiểm tra công nợ khách hàng trước khi ghi nhận thanh toán.");
            if (scope.has(PermissionNames.PAYMENT_CREATE)) {
                steps.add("Mở Thanh toán và ghi đúng số tiền thực nhận cho đúng khách hàng.");
                steps.add("Kiểm tra lại báo cáo công nợ sau khi ghi nhận thanh toán.");
            } else {
                steps.add("Bạn có thể xem thông tin tài chính được cấp, nhưng ghi nhận thanh toán cần quyền Ghi nhận thanh toán.");
            }

            return response(
                "Quy trình tài chính giúp tiền thu và công nợ của doanh nghiệp luôn chính xác.",
                steps,
                scope.relatedModules(locale, "Payments", "Customers", "Reports"),
                List.of(
                    "Không ghi nhận thanh toán trước khi tiền thật sự được nhận.",
                    "Dữ liệu công nợ và doanh thu chỉ nên chia sẻ cho vai trò thật sự cần."
                ),
                locale
            );
        }

        List<String> steps = new ArrayList<>();
        steps.add("Review customer debt before recording a payment.");
        if (scope.has(PermissionNames.PAYMENT_CREATE)) {
            steps.add("Open Payments and record the amount actually received for the correct customer.");
            steps.add("Recheck debt reports after posting the payment.");
        } else {
            steps.add("You may view permitted finance information, but recording payments requires PAYMENT_CREATE.");
        }

        return response(
            "Finance workflow keeps payments and receivables accurate for the business.",
            steps,
            scope.relatedModules(locale, "Payments", "Customers", "Reports"),
            List.of(
                "Do not record a payment before money is received.",
                "Debt and revenue data should only be shared with roles that need it."
            ),
            locale
        );
    }

    public HelpAnswerResponse reportAnswer(HelpPermissionScope scope, HelpLocale locale) {
        List<String> steps = new ArrayList<>();
        if (locale == HelpLocale.VI) {
            steps.add("Mở Tổng quan để xem nhanh tình hình kinh doanh.");
            steps.add("Dùng Báo cáo khi cần đối soát chi tiết.");
            steps.add(reportReconciliationStep(scope, locale));

            return response(
                "Tổng quan và Báo cáo dùng để theo dõi doanh thu, công nợ, tồn kho và hiệu quả vận hành.",
                steps,
                scope.relatedModules(locale, "Dashboard", "Reports", "Audit Logs"),
                List.of("Báo cáo chứa dữ liệu kinh doanh nhạy cảm và chỉ nên chia sẻ cho người có quyền."),
                locale
            );
        }

        steps.add("Open Dashboard for a fast business overview.");
        steps.add("Use Reports when detailed reconciliation is needed.");
        steps.add(reportReconciliationStep(scope, locale));

        return response(
            "Dashboard and Reports are for reviewing revenue, debt, stock and operational performance.",
            steps,
            scope.relatedModules(locale, "Dashboard", "Reports", "Audit Logs"),
            List.of("Reports may contain sensitive business data and should only be shared with authorized users."),
            locale
        );
    }

    private String reportReconciliationStep(HelpPermissionScope scope, HelpLocale locale) {
        List<String> sources = new ArrayList<>();
        if (scope.canViewSalesData()) {
            sources.add(HelpDisplayNames.module("Sales Orders", locale));
        }
        if (scope.canViewInventoryData()) {
            sources.add(HelpDisplayNames.module("Inventory", locale));
        }
        if (scope.has(PermissionNames.PAYMENT_CREATE)) {
            sources.add(HelpDisplayNames.module("Payments", locale));
        }

        if (sources.isEmpty()) {
            return locale == HelpLocale.VI
                ? "Nếu số liệu bất thường, chỉ đối chiếu trong phạm vi được cấp hoặc nhờ Chủ doanh nghiệp kiểm tra dữ liệu nguồn."
                : "If numbers look unusual, reconcile only within your assigned scope or ask Owner to check the source records.";
        }

        String joinedSources = String.join(", ", sources);
        return locale == HelpLocale.VI
            ? "Nếu số liệu bất thường, đối chiếu các dữ liệu nguồn bạn được phép xem: " + joinedSources + "."
            : "If numbers look unusual, compare the source data you are allowed to view: " + joinedSources + ".";
    }
}
