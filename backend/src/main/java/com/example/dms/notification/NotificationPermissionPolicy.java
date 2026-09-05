package com.example.dms.notification;

import com.example.dms.user.PermissionNames;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Permission boundary for notification content. NOTIFICATION_VIEW is the gateway to the feed;
 * this policy decides which business-event types the current account may actually see.
 * Unknown types are denied by default so a newly introduced event cannot bypass RBAC silently.
 */
final class NotificationPermissionPolicy {

    private static final String LOW_STOCK = "LOW_STOCK";
    private static final String OVERDUE_DEBT = "OVERDUE_DEBT";
    private static final String PAYMENT_RECORDED = "PAYMENT_RECORDED";
    private static final String SALES_ORDER_CONFIRMED = "SALES_ORDER_CONFIRMED";
    private static final String SALES_ORDER_CANCELLED = "SALES_ORDER_CANCELLED";
    private static final String INVOICE_ISSUED = "INVOICE_ISSUED";

    private static final Set<String> KNOWN_TYPES = Set.of(
        LOW_STOCK,
        OVERDUE_DEBT,
        PAYMENT_RECORDED,
        SALES_ORDER_CONFIRMED,
        SALES_ORDER_CANCELLED,
        INVOICE_ISSUED
    );

    private NotificationPermissionPolicy() {
    }

    static boolean canView(String type, Set<String> permissions) {
        if (type == null || permissions == null) {
            return false;
        }

        return switch (type) {
            case LOW_STOCK -> hasAll(permissions, PermissionNames.PRODUCT_VIEW, PermissionNames.INVENTORY_VIEW);
            case OVERDUE_DEBT -> hasAll(permissions, PermissionNames.CUSTOMER_VIEW, PermissionNames.DEBT_VIEW);
            case PAYMENT_RECORDED -> hasAll(permissions, PermissionNames.CUSTOMER_VIEW, PermissionNames.PAYMENT_CREATE);
            case SALES_ORDER_CONFIRMED, SALES_ORDER_CANCELLED -> permissions.contains(PermissionNames.SALES_ORDER_VIEW);
            // Legacy invoice events may expose both order and receivable information. Keep them conservative.
            case INVOICE_ISSUED -> hasAll(
                permissions,
                PermissionNames.CUSTOMER_VIEW,
                PermissionNames.SALES_ORDER_VIEW,
                PermissionNames.DEBT_VIEW
            );
            default -> false;
        };
    }

    static Set<String> allowedPersistedTypes(Set<String> permissions) {
        return KNOWN_TYPES.stream()
            .filter(type -> canView(type, permissions))
            .collect(Collectors.toUnmodifiableSet());
    }

    private static boolean hasAll(Set<String> permissions, String... required) {
        for (String permission : required) {
            if (!permissions.contains(permission)) {
                return false;
            }
        }

        return true;
    }
}
