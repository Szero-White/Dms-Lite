package com.example.dms.notification;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;
import org.junit.jupiter.api.Test;

class NotificationPermissionPolicyTest {

    @Test
    void cashierOnlySeesPaymentEvents() {
        Set<String> permissions = Set.of(
            "NOTIFICATION_VIEW",
            "CUSTOMER_VIEW",
            "PAYMENT_CREATE"
        );

        assertThat(NotificationPermissionPolicy.canView("PAYMENT_RECORDED", permissions)).isTrue();
        assertThat(NotificationPermissionPolicy.canView("OVERDUE_DEBT", permissions)).isFalse();
        assertThat(NotificationPermissionPolicy.canView("LOW_STOCK", permissions)).isFalse();
        assertThat(NotificationPermissionPolicy.canView("SALES_ORDER_CONFIRMED", permissions)).isFalse();
        assertThat(NotificationPermissionPolicy.canView("SALES_ORDER_CANCELLED", permissions)).isFalse();
    }

    @Test
    void salesOrderEventsRequireSalesOrderView() {
        Set<String> createOnly = Set.of(
            "NOTIFICATION_VIEW",
            "CUSTOMER_VIEW",
            "PRODUCT_VIEW",
            "INVENTORY_VIEW",
            "SALES_ORDER_CREATE"
        );
        Set<String> viewer = Set.of("NOTIFICATION_VIEW", "SALES_ORDER_VIEW");

        assertThat(NotificationPermissionPolicy.canView("SALES_ORDER_CONFIRMED", createOnly)).isFalse();
        assertThat(NotificationPermissionPolicy.canView("SALES_ORDER_CANCELLED", createOnly)).isFalse();
        assertThat(NotificationPermissionPolicy.canView("SALES_ORDER_CONFIRMED", viewer)).isTrue();
        assertThat(NotificationPermissionPolicy.canView("SALES_ORDER_CANCELLED", viewer)).isTrue();
    }

    @Test
    void customInventoryMonitorOnlySeesLowStockEvents() {
        Set<String> permissions = Set.of(
            "NOTIFICATION_VIEW",
            "PRODUCT_VIEW",
            "INVENTORY_VIEW",
            "AI_HELP_VIEW"
        );

        assertThat(NotificationPermissionPolicy.canView("LOW_STOCK", permissions)).isTrue();
        assertThat(NotificationPermissionPolicy.canView("OVERDUE_DEBT", permissions)).isFalse();
        assertThat(NotificationPermissionPolicy.canView("PAYMENT_RECORDED", permissions)).isFalse();
        assertThat(NotificationPermissionPolicy.canView("SALES_ORDER_CONFIRMED", permissions)).isFalse();
        assertThat(NotificationPermissionPolicy.canView("SALES_ORDER_CANCELLED", permissions)).isFalse();
    }

    @Test
    void notificationOnlyCustomRoleDoesNotReceiveBusinessEventContent() {
        Set<String> permissions = Set.of("NOTIFICATION_VIEW", "AI_HELP_VIEW");

        assertThat(NotificationPermissionPolicy.allowedPersistedTypes(permissions)).isEmpty();
        assertThat(NotificationPermissionPolicy.canView("LOW_STOCK", permissions)).isFalse();
        assertThat(NotificationPermissionPolicy.canView("OVERDUE_DEBT", permissions)).isFalse();
        assertThat(NotificationPermissionPolicy.canView("PAYMENT_RECORDED", permissions)).isFalse();
    }

    @Test
    void unknownNotificationTypesFailClosed() {
        assertThat(NotificationPermissionPolicy.canView(
            "FUTURE_SENSITIVE_EVENT",
            Set.of("NOTIFICATION_VIEW", "TEAM_MANAGE")
        )).isFalse();
    }
}
