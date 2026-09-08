package com.example.dms.payment;

import com.example.dms.user.PermissionNames;
import java.util.Collection;
import java.util.Set;

/**
 * Shared authorization boundary for the payment workspace.
 *
 * Recording and reviewing payments exposes customer, order and receivable data,
 * so PAYMENT_CREATE alone is intentionally insufficient.
 */
public final class PaymentWorkspaceAccessPolicy {

    private static final Set<String> REQUIRED_PERMISSIONS = Set.of(
        PermissionNames.PAYMENT_CREATE,
        PermissionNames.CUSTOMER_VIEW,
        PermissionNames.SALES_ORDER_VIEW,
        PermissionNames.DEBT_VIEW
    );

    private PaymentWorkspaceAccessPolicy() {
    }

    public static boolean canAccess(Collection<String> authorities) {
        return authorities != null && authorities.containsAll(REQUIRED_PERMISSIONS);
    }

    public static Set<String> requiredPermissions() {
        return REQUIRED_PERMISSIONS;
    }
}
