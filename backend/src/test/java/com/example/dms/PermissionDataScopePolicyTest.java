package com.example.dms;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.dms.customer.CustomerAccessPolicy;
import com.example.dms.product.ProductAccessPolicy;
import com.example.dms.user.PermissionNames;
import java.util.List;
import org.junit.jupiter.api.Test;

class PermissionDataScopePolicyTest {

    @Test
    void customerViewAloneDoesNotRevealReceivableBalance() {
        assertThat(CustomerAccessPolicy.canViewBalance(List.of(PermissionNames.CUSTOMER_VIEW)))
            .isFalse();
    }

    @Test
    void operationalSalesAndPaymentPermissionsCanSeeCustomerBalance() {
        assertThat(CustomerAccessPolicy.canViewBalance(List.of(PermissionNames.SALES_ORDER_CREATE)))
            .isTrue();
        assertThat(CustomerAccessPolicy.canViewBalance(List.of(PermissionNames.PAYMENT_CREATE)))
            .isTrue();
    }

    @Test
    void productViewAloneDoesNotRevealCostPrice() {
        assertThat(ProductAccessPolicy.canViewCost(List.of(PermissionNames.PRODUCT_VIEW)))
            .isFalse();
    }

    @Test
    void productManagementAndReportsCanSeeCostPrice() {
        assertThat(ProductAccessPolicy.canViewCost(List.of(PermissionNames.PRODUCT_MANAGE)))
            .isTrue();
        assertThat(ProductAccessPolicy.canViewCost(List.of(PermissionNames.REPORT_VIEW)))
            .isTrue();
    }
}
