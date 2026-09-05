package com.example.dms.help;

import com.example.dms.sales.SalesOrderAccessPolicy;
import com.example.dms.user.PermissionNames;
import java.util.ArrayList;
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
            || has(PermissionNames.CUSTOMER_MANAGE);
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
        addIfAllowed(modules, PermissionNames.PRODUCT_VIEW, "Products");
        addIfAllowed(modules, PermissionNames.CUSTOMER_VIEW, "Customers");
        addIfAllowed(modules, PermissionNames.INVENTORY_VIEW, "Inventory");
        addIfAllowed(modules, PermissionNames.PAYMENT_CREATE, "Payments");
        addIfAllowed(modules, PermissionNames.TEAM_MANAGE, "Team Access");
        return modules;
    }

    private void addIfAllowed(Collection<String> modules, String permission, String module) {
        if (has(permission)) {
            modules.add(module);
        }
    }
}
