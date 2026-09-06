package com.example.dms.help;

import com.example.dms.sales.SalesOrderAccessPolicy;
import com.example.dms.user.PermissionNames;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;

public class HelpPermissionScope {

    private final Set<String> permissions;

    private HelpPermissionScope(Set<String> permissions) {
        this.permissions = permissions;
    }

    public static HelpPermissionScope from(Authentication authentication) {
        return new HelpPermissionScope(authentication.getAuthorities()
            .stream()
            .map(GrantedAuthority::getAuthority)
            .collect(Collectors.toSet()));
    }

    public boolean has(String permission) {
        return permissions.contains(permission);
    }

    public List<String> permissions() {
        return permissions.stream().sorted().toList();
    }

    public boolean canManageTeam() {
        return has(PermissionNames.TEAM_MANAGE);
    }

    /**
     * Workflow guidance can be available when the user can perform any sales action.
     * Real sales-order data is guarded separately by canViewSalesData().
     */
    public boolean canUseSales() {
        return has(PermissionNames.SALES_ORDER_VIEW)
            || has(PermissionNames.SALES_ORDER_CREATE)
            || has(PermissionNames.SALES_ORDER_CONFIRM)
            || has(PermissionNames.SALES_ORDER_CANCEL);
    }

    public boolean canViewSalesData() {
        return has(PermissionNames.SALES_ORDER_VIEW);
    }

    public boolean canUseInvoices() {
        return has(PermissionNames.INVOICE_VIEW)
            || has(PermissionNames.INVOICE_CREATE)
            || has(PermissionNames.INVOICE_ISSUE)
            || has(PermissionNames.INVOICE_CANCEL);
    }

    /**
     * Workflow guidance can cover inventory actions, while live stock data requires INVENTORY_VIEW.
     */
    public boolean canUseInventory() {
        return has(PermissionNames.INVENTORY_VIEW)
            || has(PermissionNames.INVENTORY_MANAGE);
    }

    public boolean canViewInventoryData() {
        return has(PermissionNames.INVENTORY_VIEW);
    }

    /**
     * PAYMENT_CREATE permits payment workflow guidance; receivable values require DEBT_VIEW.
     */
    public boolean canUseFinance() {
        return has(PermissionNames.PAYMENT_CREATE)
            || has(PermissionNames.DEBT_VIEW);
    }

    public boolean canViewDebtData() {
        return has(PermissionNames.DEBT_VIEW);
    }

    public boolean canViewOrderFinancials() {
        return SalesOrderAccessPolicy.canViewFinancials(permissions);
    }

    public boolean canUseProducts() {
        return has(PermissionNames.PRODUCT_VIEW)
            || has(PermissionNames.PRODUCT_MANAGE);
    }

    public boolean canViewProductData() {
        return has(PermissionNames.PRODUCT_VIEW);
    }

    public boolean canUseCustomers() {
        return has(PermissionNames.CUSTOMER_VIEW)
            || has(PermissionNames.CUSTOMER_MANAGE)
            || has(PermissionNames.CUSTOMER_DEACTIVATE);
    }

    public boolean canViewCustomerData() {
        return has(PermissionNames.CUSTOMER_VIEW);
    }

    public boolean canUseReports() {
        return has(PermissionNames.REPORT_VIEW);
    }

    public List<String> visibleModules() {
        List<String> modules = new ArrayList<>();
        addIfAllowed(modules, PermissionNames.REPORT_VIEW, "Dashboard/Reports");
        if (canUseSales()) {
            modules.add("Sales Orders");
        }
        if (canUseInvoices()) {
            modules.add("Invoices");
        }
        addIfAllowed(modules, PermissionNames.PRODUCT_VIEW, "Products");
        addIfAllowed(modules, PermissionNames.CUSTOMER_VIEW, "Customers");
        addIfAllowed(modules, PermissionNames.INVENTORY_VIEW, "Inventory");
        addIfAllowed(modules, PermissionNames.PAYMENT_CREATE, "Payments");
        addIfAllowed(modules, PermissionNames.AUDIT_VIEW, "Audit Logs");
        addIfAllowed(modules, PermissionNames.NOTIFICATION_VIEW, "Notifications");
        addIfAllowed(modules, PermissionNames.TEAM_MANAGE, "Team Access");
        return modules;
    }

    public List<String> visibleModules(HelpLocale locale) {
        return HelpDisplayNames.modules(locale, visibleModules());
    }

    /**
     * Filters assistant module hints through the same permission scope used by the app.
     * This prevents a custom role from being shown related-module tags for screens it cannot use.
     * Unknown module names fail closed.
     */
    public List<String> relatedModules(HelpLocale locale, String... canonicalModules) {
        if (canonicalModules == null || canonicalModules.length == 0) {
            return List.of();
        }

        return HelpDisplayNames.modules(
            locale,
            Arrays.stream(canonicalModules)
                .filter(this::canReferenceModule)
                .distinct()
                .toList()
        );
    }

    boolean canReferenceModule(String canonicalModule) {
        if (canonicalModule == null) {
            return false;
        }

        return switch (canonicalModule) {
            case "Dashboard", "Reports", "Dashboard/Reports" -> canUseReports();
            case "Sales Orders" -> canUseSales();
            case "Sales order finance" -> canViewOrderFinancials();
            case "Invoices" -> canUseInvoices();
            case "Products" -> canUseProducts();
            case "Customers" -> canUseCustomers();
            case "Inventory" -> canUseInventory();
            case "Payments" -> has(PermissionNames.PAYMENT_CREATE);
            case "Payments/Debt" -> canUseFinance();
            case "Team Access", "Roles & Permissions" -> canManageTeam();
            case "Audit Logs" -> has(PermissionNames.AUDIT_VIEW);
            case "Notifications" -> has(PermissionNames.NOTIFICATION_VIEW);
            default -> false;
        };
    }

    private void addIfAllowed(Collection<String> modules, String permission, String module) {
        if (has(permission)) {
            modules.add(module);
        }
    }
}
