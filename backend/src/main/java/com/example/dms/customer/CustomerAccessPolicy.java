package com.example.dms.customer;

import com.example.dms.user.PermissionNames;
import java.util.Collection;
import java.util.Set;

public final class CustomerAccessPolicy {

    private static final Set<String> BALANCE_PERMISSIONS = Set.of(
        PermissionNames.DEBT_VIEW,
        PermissionNames.PAYMENT_CREATE,
        PermissionNames.REPORT_VIEW,
        PermissionNames.SALES_ORDER_CREATE
    );

    private CustomerAccessPolicy() {
    }

    public static boolean canViewBalance(Collection<String> authorities) {
        return authorities.stream().anyMatch(BALANCE_PERMISSIONS::contains);
    }
}
