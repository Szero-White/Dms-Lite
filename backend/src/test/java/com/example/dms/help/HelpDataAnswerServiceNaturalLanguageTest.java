package com.example.dms.help;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

import com.example.dms.common.TenantContext;
import com.example.dms.customer.Customer;
import com.example.dms.customer.CustomerRepository;
import com.example.dms.debt.CustomerDebtRepository;
import com.example.dms.inventory.StockItem;
import com.example.dms.inventory.StockItemRepository;
import com.example.dms.product.Product;
import com.example.dms.product.ProductRepository;
import com.example.dms.sales.SalesOrder;
import com.example.dms.sales.SalesOrderRepository;
import com.example.dms.sales.SalesOrderStatus;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

class HelpDataAnswerServiceNaturalLanguageTest {

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

    @BeforeEach
    void setUp() {
        TenantContext.set(1L, 10L);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void vietnameseStockQuestionWithSkuAndNaturalWordingReadsInventory() {
        Product tea = Product.builder()
            .id(2L)
            .tenantId(1L)
            .name("Trà xanh thùng 24 chai")
            .sku("TEA-24")
            .minStock(8)
            .build();
        StockItem stock = StockItem.builder()
            .tenantId(1L)
            .warehouseId(1L)
            .productId(2L)
            .quantityOnHand(8)
            .build();

        when(products.findFirstByTenantIdAndDeletedAtIsNullAndSkuIgnoreCase(1L, "TEA-24"))
            .thenReturn(Optional.of(tea));
        when(stockItems.findByTenantIdAndProductId(1L, 2L)).thenReturn(List.of(stock));

        HelpAnswerResponse answer = service.answer(
                new HelpAskRequest("TEA-24 hiện còn bao nhiêu hàng?", "vi", List.of()),
                scope("AI_HELP_VIEW", "PRODUCT_VIEW", "INVENTORY_VIEW"),
                HelpLocale.VI
            )
            .orElseThrow();

        assertThat(answer.blocked()).isFalse();
        assertThat(answer.answer()).contains("TEA-24", "8 đơn vị");
    }

    @Test
    void vietnameseStockQuestionWithNaturalWordingStillRequiresInventoryView() {
        HelpAnswerResponse answer = service.answer(
                new HelpAskRequest("TEA-24 hiện còn bao nhiêu hàng?", "vi", List.of()),
                scope("AI_HELP_VIEW", "PRODUCT_VIEW"),
                HelpLocale.VI
            )
            .orElseThrow();

        assertThat(answer.blocked()).isTrue();
        verifyNoInteractions(products, stockItems);
    }

    @Test
    void vietnameseOrderStatusQuestionRecognizesCurrentMultiSegmentOrderCode() {
        SalesOrder order = SalesOrder.builder()
            .id(20L)
            .tenantId(1L)
            .code("SO-20260906-0002")
            .status(SalesOrderStatus.COMPLETED)
            .totalAmount(new BigDecimal("3300000"))
            .paidAmount(BigDecimal.ZERO)
            .debtAmount(new BigDecimal("3300000"))
            .build();

        when(salesOrders.findFirstByTenantIdAndCodeIgnoreCase(1L, "SO-20260906-0002"))
            .thenReturn(Optional.of(order));

        HelpAnswerResponse answer = service.answer(
                new HelpAskRequest("Đơn SO-20260906-0002 đang ở trạng thái nào?", "vi", List.of()),
                scope("AI_HELP_VIEW", "SALES_ORDER_VIEW"),
                HelpLocale.VI
            )
            .orElseThrow();

        assertThat(answer.blocked()).isFalse();
        assertThat(answer.answer()).contains("SO-20260906-0002", "Hoàn tất");
    }

    @Test
    void vietnameseMultiSegmentOrderQuestionStillRequiresSalesOrderView() {
        HelpAnswerResponse answer = service.answer(
                new HelpAskRequest("Đơn SO-20260906-0002 đang ở trạng thái nào?", "vi", List.of()),
                scope("AI_HELP_VIEW", "SALES_ORDER_CREATE", "CUSTOMER_VIEW", "PRODUCT_VIEW", "INVENTORY_VIEW"),
                HelpLocale.VI
            )
            .orElseThrow();

        assertThat(answer.blocked()).isTrue();
        verifyNoInteractions(salesOrders);
    }

    @Test
    void explicitOrderCodeKeepsRemainingReceivableQuestionInOrderScope() {
        SalesOrder order = SalesOrder.builder()
            .id(20L)
            .tenantId(1L)
            .code("SO-20260906-0002")
            .status(SalesOrderStatus.COMPLETED)
            .totalAmount(new BigDecimal("3300000"))
            .paidAmount(new BigDecimal("1000000"))
            .debtAmount(new BigDecimal("2300000"))
            .build();

        when(salesOrders.findFirstByTenantIdAndCodeIgnoreCase(1L, "SO-20260906-0002"))
            .thenReturn(Optional.of(order));

        HelpAnswerResponse answer = service.answer(
                new HelpAskRequest("Đơn SO-20260906-0002 còn phải thu bao nhiêu?", "vi", List.of()),
                scope("AI_HELP_VIEW", "SALES_ORDER_VIEW", "SALES_ORDER_CREATE"),
                HelpLocale.VI
            )
            .orElseThrow();

        assertThat(answer.blocked()).isFalse();
        assertThat(answer.answer()).contains("SO-20260906-0002", "2.300.000");
    }


    @Test
    void accentedVietnameseCustomerDebtQuestionResolvesSpecificCustomer() {
        Customer customer = Customer.builder()
            .id(7L)
            .tenantId(1L)
            .name("Tạp hóa Cô Lan")
            .active(true)
            .build();

        when(customers.findByTenantIdAndDeletedAtIsNullAndNameContainingIgnoreCase(
            org.mockito.ArgumentMatchers.eq(1L),
            org.mockito.ArgumentMatchers.eq("Tạp hóa Cô Lan"),
            any(Pageable.class)
        )).thenReturn(new PageImpl<>(List.of(customer)));
        when(customerDebts.balance(1L, 7L)).thenReturn(new BigDecimal("2300000"));

        HelpAnswerResponse answer = service.answer(
                new HelpAskRequest("Khách hàng Tạp hóa Cô Lan hiện còn công nợ bao nhiêu?", "vi", List.of()),
                scope("AI_HELP_VIEW", "CUSTOMER_VIEW", "DEBT_VIEW"),
                HelpLocale.VI
            )
            .orElseThrow();

        assertThat(answer.blocked()).isFalse();
        assertThat(answer.answer()).contains("Tạp hóa Cô Lan", "2.300.000");
    }

    @Test
    void englishCustomerDebtQuestionKeepsFullCustomerName() {
        Customer customer = Customer.builder()
            .id(8L)
            .tenantId(1L)
            .name("Acme Store")
            .active(true)
            .build();

        when(customers.findByTenantIdAndDeletedAtIsNullAndNameContainingIgnoreCase(
            org.mockito.ArgumentMatchers.eq(1L),
            org.mockito.ArgumentMatchers.eq("Acme Store"),
            any(Pageable.class)
        )).thenReturn(new PageImpl<>(List.of(customer)));
        when(customerDebts.balance(1L, 8L)).thenReturn(new BigDecimal("125000"));

        HelpAnswerResponse answer = service.answer(
                new HelpAskRequest("Customer Acme Store current debt?", "en", List.of()),
                scope("AI_HELP_VIEW", "CUSTOMER_VIEW", "DEBT_VIEW"),
                HelpLocale.EN
            )
            .orElseThrow();

        assertThat(answer.blocked()).isFalse();
        assertThat(answer.answer()).contains("Acme Store");
    }

    @Test
    void ambiguousDebtQuestionDoesNotSilentlyReturnTenantTotal() {
        HelpAnswerResponse answer = service.answer(
                new HelpAskRequest("Công nợ hiện tại bao nhiêu?", "vi", List.of()),
                scope("AI_HELP_VIEW", "CUSTOMER_VIEW", "DEBT_VIEW"),
                HelpLocale.VI
            )
            .orElseThrow();

        assertThat(answer.blocked()).isFalse();
        assertThat(answer.answer()).contains("chưa đủ rõ");
        verifyNoInteractions(customers, customerDebts);
    }

    @Test
    void explicitTotalDebtQuestionStillReturnsTenantTotal() {
        when(customerDebts.totalReceivable(1L)).thenReturn(new BigDecimal("2300000"));

        HelpAnswerResponse answer = service.answer(
                new HelpAskRequest("Tổng công nợ hiện tại của công ty là bao nhiêu?", "vi", List.of()),
                scope("AI_HELP_VIEW", "CUSTOMER_VIEW", "DEBT_VIEW"),
                HelpLocale.VI
            )
            .orElseThrow();

        assertThat(answer.blocked()).isFalse();
        assertThat(answer.answer()).contains("2.300.000");
    }

    @Test
    void unknownSkuDoesNotFallBackToAggregateInventory() {
        when(products.findFirstByTenantIdAndDeletedAtIsNullAndSkuIgnoreCase(1L, "BAD-99"))
            .thenReturn(Optional.empty());

        HelpAnswerResponse answer = service.answer(
                new HelpAskRequest("BAD-99 hiện còn bao nhiêu hàng?", "vi", List.of()),
                scope("AI_HELP_VIEW", "PRODUCT_VIEW", "INVENTORY_VIEW"),
                HelpLocale.VI
            )
            .orElseThrow();

        assertThat(answer.answer()).contains("BAD-99");
        verify(products).findFirstByTenantIdAndDeletedAtIsNullAndSkuIgnoreCase(1L, "BAD-99");
        verifyNoMoreInteractions(products);
        verifyNoInteractions(stockItems);
    }

    @Test
    void invoiceCodeIsNotMisclassifiedAsProductSku() {
        Optional<HelpAnswerResponse> answer = service.answer(
            new HelpAskRequest("INV-20260906-0001 còn bao nhiêu?", "vi", List.of()),
            scope("AI_HELP_VIEW", "PRODUCT_VIEW", "INVENTORY_VIEW", "INVOICE_VIEW"),
            HelpLocale.VI
        );

        assertThat(answer).isEmpty();
        verifyNoInteractions(products, stockItems, salesOrders, customerDebts);
    }

    @Test
    void unknownOrderCodeDoesNotFallBackToTenantOrderCount() {
        when(salesOrders.findFirstByTenantIdAndCodeIgnoreCase(1L, "SO-20260906-9999"))
            .thenReturn(Optional.empty());

        HelpAnswerResponse answer = service.answer(
                new HelpAskRequest("Đơn SO-20260906-9999 đang ở trạng thái nào?", "vi", List.of()),
                scope("AI_HELP_VIEW", "SALES_ORDER_VIEW"),
                HelpLocale.VI
            )
            .orElseThrow();

        assertThat(answer.answer()).contains("SO-20260906-9999");
        verify(salesOrders).findFirstByTenantIdAndCodeIgnoreCase(1L, "SO-20260906-9999");
        verifyNoMoreInteractions(salesOrders);
    }

    @Test
    void customerStatusQuestionDoesNotPretendToBeCustomerCount() {
        Optional<HelpAnswerResponse> answer = service.answer(
            new HelpAskRequest("Khách hàng Cô Lan đang có trạng thái gì?", "vi", List.of()),
            scope("AI_HELP_VIEW", "CUSTOMER_VIEW"),
            HelpLocale.VI
        );

        assertThat(answer).isEmpty();
        verifyNoInteractions(customers);
    }

    @Test
    void productStatusQuestionDoesNotPretendToBeProductCount() {
        Optional<HelpAnswerResponse> answer = service.answer(
            new HelpAskRequest("Sản phẩm WATER-24 đang có trạng thái gì?", "vi", List.of()),
            scope("AI_HELP_VIEW", "PRODUCT_VIEW"),
            HelpLocale.VI
        );

        assertThat(answer).isEmpty();
        verifyNoInteractions(products);
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
