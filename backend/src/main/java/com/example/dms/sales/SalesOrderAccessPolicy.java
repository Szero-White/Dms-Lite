package com.example.dms.sales;

import com.example.dms.user.PermissionNames;
import java.util.Collection;
import java.util.Set;

public final class SalesOrderAccessPolicy {

    private static final Set<String> FINANCIAL_PERMISSIONS = Set.of(
        PermissionNames.DEBT_VIEW,
        PermissionNames.PAYMENT_CREATE,
        PermissionNames.REPORT_VIEW,
        PermissionNames.SALES_ORDER_CREATE
    );

    private SalesOrderAccessPolicy() {
    }

    public static boolean canViewFinancials(Collection<String> authorities) {
        return authorities.stream().anyMatch(FINANCIAL_PERMISSIONS::contains);
    }
}
