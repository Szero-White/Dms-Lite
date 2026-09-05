package com.example.dms.help;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

import com.example.dms.customer.CustomerRepository;
import com.example.dms.debt.CustomerDebtRepository;
import com.example.dms.inventory.StockItemRepository;
import com.example.dms.product.ProductRepository;
import com.example.dms.sales.SalesOrderRepository;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

class HelpDataAnswerServiceAuthorizationTest {

    private final ProductRepository products = mock(ProductRepository.class);
    private final StockItemRepository stockItems = mock(StockItemRepository.class);
    private final CustomerRepository customers = mock(CustomerRepository.class);
    private final SalesOrderRepository salesOrders = mock(SalesOrderRepository.class);
    private final CustomerDebtRepository customerDebts = mock(CustomerDebtRepository.class);

    private final HelpDataAnswerService service = new HelpDataAnswerService(
        products,
        stockItems,
        customers,
        salesOrders,
        customerDebts
    );

    @Test
    void paymentCreateAllowsWorkflowButDoesNotExposeDebtDataWithoutDebtView() {
        HelpPermissionScope scope = scope("AI_HELP_VIEW", "CUSTOMER_VIEW", "PAYMENT_CREATE");

        assertThat(scope.canUseFinance()).isTrue();
        assertThat(scope.canViewDebtData()).isFalse();

        HelpAnswerResponse answer = service.answer(
                new HelpAskRequest("Khach hang Minh Phat no bao nhieu?", "vi", List.of()),
                scope,
                HelpLocale.VI
            )
            .orElseThrow();

        assertThat(answer.blocked()).isTrue();
        verifyNoInteractions(customers, customerDebts);
    }

    @Test
    void salesOrderCreateDoesNotExposeExistingOrdersWithoutSalesOrderView() {
        HelpPermissionScope scope = scope(
            "AI_HELP_VIEW",
            "CUSTOMER_VIEW",
            "PRODUCT_VIEW",
            "INVENTORY_VIEW",
            "SALES_ORDER_CREATE"
        );

        assertThat(scope.canUseSales()).isTrue();
        assertThat(scope.canViewSalesData()).isFalse();
        assertThat(scope.visibleModules()).contains("Sales Orders");

        HelpAnswerResponse answer = service.answer(
                new HelpAskRequest("Don hang SO-123 dang o trang thai nao?", "vi", List.of()),
                scope,
                HelpLocale.VI
            )
            .orElseThrow();

        assertThat(answer.blocked()).isTrue();
        verifyNoInteractions(salesOrders);
    }

    @Test
    void inventoryManageAloneCannotBeUsedAsADataReadBackdoor() {
        HelpPermissionScope scope = scope("AI_HELP_VIEW", "INVENTORY_MANAGE");

        assertThat(scope.canUseInventory()).isTrue();
        assertThat(scope.canViewInventoryData()).isFalse();

        HelpAnswerResponse answer = service.answer(
                new HelpAskRequest("Ton kho WATER-24 con bao nhieu?", "vi", List.of()),
                scope,
                HelpLocale.VI
            )
            .orElseThrow();

        assertThat(answer.blocked()).isTrue();
        verifyNoInteractions(products, stockItems);
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
