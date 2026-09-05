package com.example.dms.help;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

class HelpDisplayNamesTest {

    @Test
    void localizesVisibleModulesForVietnameseWithoutChangingAuthorizationKeys() {
        HelpPermissionScope scope = scope("REPORT_VIEW", "SALES_ORDER_VIEW", "INVENTORY_VIEW");

        assertThat(scope.visibleModules()).contains("Dashboard/Reports", "Sales Orders", "Inventory");
        assertThat(scope.visibleModules(HelpLocale.VI))
            .contains("Tổng quan/Báo cáo", "Đơn bán hàng", "Kho hàng")
            .doesNotContain("Sales Orders", "Inventory");
    }

    @Test
    void localizesSalesOrderStatusForVietnamese() {
        assertThat(HelpDisplayNames.salesOrderStatus("DRAFT", HelpLocale.VI)).isEqualTo("Nháp");
        assertThat(HelpDisplayNames.salesOrderStatus("COMPLETED", HelpLocale.VI)).isEqualTo("Hoàn tất");
        assertThat(HelpDisplayNames.salesOrderStatus("CANCELLED", HelpLocale.VI)).isEqualTo("Đã hủy");
        assertThat(HelpDisplayNames.salesOrderStatus("COMPLETED", HelpLocale.EN)).isEqualTo("Completed");
    }

    private HelpPermissionScope scope(String... permissions) {
        Set<SimpleGrantedAuthority> authorities = java.util.Arrays.stream(permissions)
            .map(SimpleGrantedAuthority::new)
            .collect(java.util.stream.Collectors.toSet());

        return HelpPermissionScope.from(
            new UsernamePasswordAuthenticationToken("test-user", "n/a", authorities)
        );
    }
}
