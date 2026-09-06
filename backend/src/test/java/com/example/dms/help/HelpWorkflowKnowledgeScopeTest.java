package com.example.dms.help;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Arrays;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

class HelpWorkflowKnowledgeScopeTest {

    private final HelpWorkflowKnowledge knowledge = new HelpWorkflowKnowledge();

    @Test
    void warehouseSalesGuidanceDoesNotAdvertiseCustomerOrPaymentScreens() {
        HelpPermissionScope scope = scope(
            "PRODUCT_VIEW",
            "SALES_ORDER_VIEW",
            "SALES_ORDER_CONFIRM",
            "INVENTORY_VIEW",
            "INVENTORY_MANAGE",
            "NOTIFICATION_VIEW",
            "AI_HELP_VIEW"
        );

        HelpAnswerResponse answer = knowledge.salesAnswer(scope, HelpLocale.VI);

        assertThat(answer.relatedModules())
            .contains("Đơn bán hàng", "Kho hàng")
            .doesNotContain("Khách hàng", "Thanh toán");
        assertThat(answer.steps())
            .noneMatch(step -> step.contains("Kiểm tra trạng thái khách hàng"));
    }

    @Test
    void accountantReportGuidanceDoesNotAdvertiseInventoryOrAuditScreens() {
        HelpPermissionScope scope = scope(
            "PRODUCT_VIEW",
            "CUSTOMER_VIEW",
            "SALES_ORDER_VIEW",
            "PAYMENT_CREATE",
            "DEBT_VIEW",
            "REPORT_VIEW",
            "NOTIFICATION_VIEW",
            "AI_HELP_VIEW"
        );

        HelpAnswerResponse answer = knowledge.reportAnswer(scope, HelpLocale.VI);

        assertThat(answer.relatedModules())
            .contains("Tổng quan", "Báo cáo")
            .doesNotContain("Nhật ký hoạt động", "Kho hàng");
        assertThat(answer.steps())
            .anyMatch(step -> step.contains("Đơn bán hàng") && step.contains("Thanh toán"))
            .noneMatch(step -> step.contains("Kho hàng"));
    }


    @Test
    void customOperationsMonitorGuidanceStaysInsideAssignedScreens() {
        HelpPermissionScope scope = scope(
            "CUSTOMER_VIEW",
            "CUSTOMER_DEACTIVATE",
            "PRODUCT_VIEW",
            "INVENTORY_VIEW",
            "NOTIFICATION_VIEW",
            "AI_HELP_VIEW"
        );

        HelpAnswerResponse onboarding = knowledge.onboardingAnswer(scope, HelpLocale.VI);
        HelpAnswerResponse assignedWork = knowledge.assignedWorkAnswer(scope, HelpLocale.VI);
        HelpAnswerResponse testing = knowledge.testingGuideAnswer(scope, HelpLocale.VI);
        String combinedSteps = String.join(" ", onboarding.steps())
            + " " + String.join(" ", assignedWork.steps())
            + " " + String.join(" ", testing.steps());

        assertThat(onboarding.relatedModules())
            .contains("Khách hàng", "Sản phẩm", "Kho hàng", "Thông báo")
            .doesNotContain("Đơn bán hàng", "Thanh toán", "Báo cáo", "Quản lý truy cập");
        assertThat(combinedSteps)
            .doesNotContain("ghi nhận khoản tiền")
            .doesNotContain("Tạo hóa đơn")
            .doesNotContain("tạo đơn bán")
            .doesNotContain("Quản lý truy cập");
    }

    @Test
    void createOnlySalesGuidanceDoesNotTellUserToOpenHiddenOrderList() {
        HelpPermissionScope scope = scope(
            "CUSTOMER_VIEW",
            "PRODUCT_VIEW",
            "INVENTORY_VIEW",
            "SALES_ORDER_CREATE",
            "AI_HELP_VIEW"
        );

        HelpAnswerResponse answer = knowledge.salesAnswer(scope, HelpLocale.VI);

        assertThat(answer.steps())
            .noneMatch(step -> step.equals("Mở Đơn bán hàng và chọn Tạo đơn mới."));
        assertThat(answer.answerSource()).isEqualTo(HelpAnswerSource.WORKFLOW_KNOWLEDGE);
        assertThat(answer.generationProvider()).isEqualTo(HelpGenerationProvider.NONE);
    }

    private HelpPermissionScope scope(String... permissions) {
        Set<SimpleGrantedAuthority> authorities = Arrays.stream(permissions)
            .map(SimpleGrantedAuthority::new)
            .collect(java.util.stream.Collectors.toSet());

        return HelpPermissionScope.from(
            new UsernamePasswordAuthenticationToken("test-user", "n/a", authorities)
        );
    }
}
