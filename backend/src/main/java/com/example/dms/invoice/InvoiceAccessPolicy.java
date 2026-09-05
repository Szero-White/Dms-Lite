package com.example.dms.invoice;

import com.example.dms.user.PermissionNames;
import java.util.Collection;
import java.util.Set;

/**
 * Keeps invoice-document access separate from receivable/payment visibility.
 * INVOICE_VIEW allows the commercial document itself; collection state follows
 * the same financial data-scope policy as sales orders and customer balances.
 */
public final class InvoiceAccessPolicy {

    private static final Set<String> RECEIVABLE_STATE_PERMISSIONS = Set.of(
        PermissionNames.DEBT_VIEW,
        PermissionNames.PAYMENT_CREATE,
        PermissionNames.REPORT_VIEW,
        PermissionNames.SALES_ORDER_CREATE
    );

    private InvoiceAccessPolicy() {
    }

    public static boolean canViewReceivableState(Collection<String> authorities) {
        return authorities.stream().anyMatch(RECEIVABLE_STATE_PERMISSIONS::contains);
    }
}
