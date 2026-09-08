package com.example.dms.notification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.dms.common.BusinessException;
import com.example.dms.common.BusinessTimeProvider;
import com.example.dms.common.TenantContext;
import com.example.dms.customer.Customer;
import com.example.dms.customer.CustomerRepository;
import com.example.dms.debt.CustomerDebtRepository;
import com.example.dms.debt.CustomerDebtTransaction;
import com.example.dms.inventory.InventoryTransaction;
import com.example.dms.inventory.InventoryTransactionRepository;
import com.example.dms.inventory.StockItem;
import com.example.dms.inventory.StockItemRepository;
import com.example.dms.product.Product;
import com.example.dms.product.ProductRepository;
import com.example.dms.payment.Payment;
import com.example.dms.payment.PaymentRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

class NotificationQueryServiceAuthorizationTest {

    private final NotificationRepository notifications = mock(NotificationRepository.class);
    private final NotificationReadRepository notificationReads = mock(NotificationReadRepository.class);
    private final StockItemRepository stockItems = mock(StockItemRepository.class);
    private final InventoryTransactionRepository inventoryTransactions = mock(InventoryTransactionRepository.class);
    private final ProductRepository products = mock(ProductRepository.class);
    private final CustomerDebtRepository debts = mock(CustomerDebtRepository.class);
    private final CustomerRepository customers = mock(CustomerRepository.class);
    private final PaymentRepository payments = mock(PaymentRepository.class);
    private final BusinessTimeProvider businessTimeProvider = mock(BusinessTimeProvider.class);
    private final NotificationQueryService service = new NotificationQueryService(
        notifications,
        notificationReads,
        stockItems,
        inventoryTransactions,
        products,
        debts,
        customers,
        payments,
        businessTimeProvider
    );

    @BeforeEach
    void setTenant() {
        TenantContext.set(1L, 10L);
        when(notificationReads.findByTenantIdAndUserIdAndNotificationKeyIn(
            eq(1L),
            any(Long.class),
            anyCollection()
        )).thenReturn(List.of());
    }

    @AfterEach
    void clearTenant() {
        TenantContext.clear();
    }

    @Test
    void paymentWorkspaceFeedIncludesOnlyBusinessTypesAllowedByItsFullScope() {
        when(notifications.findByTenantIdAndTypeInOrderByCreatedAtDesc(
            eq(1L),
            any(),
            any(Pageable.class)
        )).thenReturn(List.of());

        service.listRecent(20, authentication(
            "NOTIFICATION_VIEW",
            "CUSTOMER_VIEW",
            "SALES_ORDER_VIEW",
            "DEBT_VIEW",
            "PAYMENT_CREATE"
        ));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Collection<String>> types = ArgumentCaptor.forClass(Collection.class);
        verify(notifications).findByTenantIdAndTypeInOrderByCreatedAtDesc(
            eq(1L),
            types.capture(),
            any(Pageable.class)
        );

        assertThat(types.getValue())
            .contains("PAYMENT_RECORDED", "OVERDUE_DEBT", "SALES_ORDER_CONFIRMED", "SALES_ORDER_CANCELLED")
            .doesNotContain("LOW_STOCK", "INVOICE_ISSUED");
    }


    @Test
    void orderSpecificPaymentNotificationIncludesSalesOrderCode() {
        when(notifications.findByTenantIdAndTypeInOrderByCreatedAtDesc(
            eq(1L),
            any(),
            any(Pageable.class)
        )).thenReturn(List.of());

        CustomerDebtTransaction paymentEntry = CustomerDebtTransaction.builder()
            .id(900L)
            .tenantId(1L)
            .customerId(5L)
            .sourceType("PAYMENT")
            .sourceId(70L)
            .direction("DECREASE")
            .amount(new BigDecimal("500000"))
            .remainingAmount(BigDecimal.ZERO)
            .createdAt(Instant.parse("2026-09-07T01:00:00Z"))
            .build();
        when(debts.findByTenantIdAndSourceTypeOrderByCreatedAtDesc(
            eq(1L),
            eq("PAYMENT"),
            any(Pageable.class)
        )).thenReturn(List.of(paymentEntry));
        when(customers.findByTenantIdAndIdInAndDeletedAtIsNull(eq(1L), anyCollection()))
            .thenReturn(List.of(customer(5L, "Anh Duong")));
        when(payments.findByTenantIdAndIdIn(eq(1L), anyCollection())).thenReturn(List.of(
            Payment.builder()
                .id(70L)
                .tenantId(1L)
                .customerId(5L)
                .salesOrderId(11L)
                .salesOrderCodeSnapshot("SO-20260907-0011")
                .build()
        ));

        List<NotificationFeedItem> feed = service.listRecent(
            20,
            authentication(
                "NOTIFICATION_VIEW",
                "CUSTOMER_VIEW",
                "SALES_ORDER_VIEW",
                "DEBT_VIEW",
                "PAYMENT_CREATE"
            )
        );

        assertThat(feed)
            .filteredOn(item -> item.type().equals("PAYMENT_RECORDED"))
            .singleElement()
            .satisfies(item -> assertThat(item.message())
                .isEqualTo("Anh Duong paid 500,000 VND for order SO-20260907-0011."));
    }

    @Test
    void paymentCreateWithoutFullWorkspaceScopeCannotSeePaymentNotifications() {
        when(notifications.findByTenantIdAndTypeInOrderByCreatedAtDesc(
            eq(1L),
            any(),
            any(Pageable.class)
        )).thenReturn(List.of());

        List<NotificationFeedItem> feed = service.listRecent(
            20,
            authentication("NOTIFICATION_VIEW", "CUSTOMER_VIEW", "PAYMENT_CREATE")
        );

        assertThat(feed).isEmpty();
        verify(notifications, never()).findByTenantIdAndTypeInOrderByCreatedAtDesc(
            any(),
            anyCollection(),
            any(Pageable.class)
        );
        verify(debts, never()).findByTenantIdAndSourceTypeOrderByCreatedAtDesc(
            any(), any(), any(Pageable.class)
        );
    }

    @Test
    void overdueFeedAggregatesMultipleReceivablesForTheSameCustomer() {
        when(businessTimeProvider.today()).thenReturn(LocalDate.of(2026, 9, 6));
        when(notifications.findByTenantIdAndTypeInOrderByCreatedAtDesc(
            eq(1L),
            any(),
            any(Pageable.class)
        )).thenReturn(List.of());

        Instant firstCreatedAt = Instant.parse("2026-09-01T01:00:00Z");
        Instant secondCreatedAt = Instant.parse("2026-09-02T01:00:00Z");
        LocalDate olderDueDate = LocalDate.of(2026, 9, 3);
        LocalDate newerDueDate = LocalDate.of(2026, 9, 5);
        Instant olderOverdueAt = Instant.parse("2026-09-03T17:00:00Z");
        Instant newerOverdueAt = Instant.parse("2026-09-05T17:00:00Z");
        when(businessTimeProvider.startOfDay(LocalDate.of(2026, 9, 4))).thenReturn(olderOverdueAt);
        when(businessTimeProvider.startOfDay(LocalDate.of(2026, 9, 6))).thenReturn(newerOverdueAt);
        when(debts.overdue(eq(1L), any(), any(Pageable.class))).thenReturn(List.of(
            debt(101L, 5L, "100000", firstCreatedAt, olderDueDate),
            debt(102L, 5L, "50000", secondCreatedAt, newerDueDate),
            debt(103L, 6L, "75000", secondCreatedAt, olderDueDate)
        ));
        when(customers.findByTenantIdAndIdInAndDeletedAtIsNull(eq(1L), anyCollection()))
            .thenReturn(List.of(
                customer(5L, "Minh Phat"),
                customer(6L, "An Khang")
            ));

        List<NotificationFeedItem> feed = service.listRecent(
            20,
            authentication("NOTIFICATION_VIEW", "CUSTOMER_VIEW", "DEBT_VIEW")
        );

        assertThat(feed).hasSize(2);
        assertThat(feed)
            .filteredOn(item -> item.id().equals("overdue-customer-5"))
            .singleElement()
            .satisfies(item -> {
                assertThat(item.message()).contains("150,000 VND");
                assertThat(item.createdAt()).isEqualTo(newerOverdueAt);
            });
    }

    @Test
    void overdueNotificationIsOrderedByWhenDebtActuallyBecameOverdue() {
        when(businessTimeProvider.today()).thenReturn(LocalDate.of(2026, 9, 8));
        when(notifications.findByTenantIdAndTypeInOrderByCreatedAtDesc(
            eq(1L),
            any(),
            any(Pageable.class)
        )).thenReturn(List.of(
            Notification.builder()
                .id(500L)
                .tenantId(1L)
                .type("SALES_ORDER_CONFIRMED")
                .title("Order confirmed")
                .message("Order confirmed")
                .createdAt(Instant.parse("2026-09-07T10:00:00Z"))
                .build()
        ));

        Instant overdueAt = Instant.parse("2026-09-07T17:00:00Z");
        when(businessTimeProvider.startOfDay(LocalDate.of(2026, 9, 8))).thenReturn(overdueAt);
        when(debts.overdue(eq(1L), any(), any(Pageable.class))).thenReturn(List.of(
            debt(
                201L,
                5L,
                "60000",
                Instant.parse("2026-08-20T01:00:00Z"),
                LocalDate.of(2026, 9, 7)
            )
        ));
        when(customers.findByTenantIdAndIdInAndDeletedAtIsNull(eq(1L), anyCollection()))
            .thenReturn(List.of(customer(5L, "Vu Van Khoa")));

        List<NotificationFeedItem> feed = service.listRecent(
            20,
            authentication("NOTIFICATION_VIEW", "CUSTOMER_VIEW", "DEBT_VIEW", "SALES_ORDER_VIEW")
        );

        assertThat(feed).hasSize(2);
        assertThat(feed.get(0).type()).isEqualTo("OVERDUE_DEBT");
        assertThat(feed.get(0).createdAt()).isEqualTo(overdueAt);
    }

    @Test
    void cashierCannotMarkSalesNotificationAsRead() {
        Notification notification = salesNotification(77L, "SALES_ORDER_CANCELLED");
        when(notifications.findByIdAndTenantId(77L, 1L))
            .thenReturn(java.util.Optional.of(notification));

        assertThatThrownBy(() -> service.setReadState(
            "77",
            true,
            authentication("NOTIFICATION_VIEW", "CUSTOMER_VIEW", "PAYMENT_CREATE")
        ))
            .isInstanceOf(BusinessException.class)
            .hasMessage("Notification not found");

        verify(notificationReads, never()).insertIfAbsent(any(), any(), any());
    }

    @Test
    @SuppressWarnings("deprecation") // Verifies read receipts never mutate the legacy V1 read_flag column.
    void salesViewerCanCreateAndRemoveOwnReadReceipt() {
        Notification notification = salesNotification(78L, "SALES_ORDER_CONFIRMED");
        when(notifications.findByIdAndTenantId(78L, 1L))
            .thenReturn(java.util.Optional.of(notification));
        service.setReadState("78", true, authentication("NOTIFICATION_VIEW", "SALES_ORDER_VIEW"));

        verify(notificationReads).insertIfAbsent(1L, 10L, "api:78");
        assertThat(notification.isReadFlag()).isFalse();

        service.setReadState("78", false, authentication("NOTIFICATION_VIEW", "SALES_ORDER_VIEW"));
        verify(notificationReads).deleteReceipt(1L, 10L, "api:78");
    }

    @Test
    void warehouseCanMarkDerivedLowStockUnreadAgain() {
        StockItem stockItem = StockItem.builder()
            .id(501L)
            .tenantId(1L)
            .warehouseId(1L)
            .productId(42L)
            .quantityOnHand(0)
            .build();
        Product product = Product.builder()
            .id(42L)
            .tenantId(1L)
            .name("Water 24")
            .minStock(10)
            .build();

        when(notifications.findByTenantIdAndTypeInOrderByCreatedAtDesc(
            eq(1L), any(), any(Pageable.class)
        )).thenReturn(List.of());
        when(stockItems.lowStock(eq(1L), any(Pageable.class))).thenReturn(List.of(stockItem));
        when(products.findByTenantIdAndIdInAndDeletedAtIsNull(eq(1L), anyCollection()))
            .thenReturn(List.of(product));
        Instant stockChangedAt = Instant.parse("2026-09-07T03:15:00Z");
        when(inventoryTransactions.findFirstByTenantIdAndWarehouseIdAndProductIdOrderByCreatedAtDesc(
            1L,
            1L,
            42L
        )).thenReturn(java.util.Optional.of(InventoryTransaction.builder()
            .id(700L)
            .tenantId(1L)
            .warehouseId(1L)
            .productId(42L)
            .createdAt(stockChangedAt)
            .build()));

        Authentication warehouse = authentication(
            "NOTIFICATION_VIEW",
            "PRODUCT_VIEW",
            "INVENTORY_VIEW"
        );

        service.setReadState("low-stock-501", true, warehouse);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<String> readKey = ArgumentCaptor.forClass(String.class);
        verify(notificationReads).insertIfAbsent(eq(1L), eq(10L), readKey.capture());
        assertThat(readKey.getValue()).startsWith("derived:low-stock-501:");

        service.setReadState("low-stock-501", false, warehouse);
        verify(notificationReads).deleteReceipt(1L, 10L, readKey.getValue());
    }

    @Test
    void lowStockNotificationUsesLastInventoryChangeInsteadOfRequestTime() {
        StockItem stockItem = StockItem.builder()
            .id(501L)
            .tenantId(1L)
            .warehouseId(1L)
            .productId(42L)
            .quantityOnHand(4)
            .build();
        Product product = Product.builder()
            .id(42L)
            .tenantId(1L)
            .name("Coffee")
            .minStock(5)
            .build();
        Instant stockChangedAt = Instant.parse("2026-09-08T06:00:00Z");

        when(notifications.findByTenantIdAndTypeInOrderByCreatedAtDesc(
            eq(1L),
            any(),
            any(Pageable.class)
        )).thenReturn(List.of());
        when(stockItems.lowStock(eq(1L), any(Pageable.class))).thenReturn(List.of(stockItem));
        when(products.findByTenantIdAndIdInAndDeletedAtIsNull(eq(1L), anyCollection()))
            .thenReturn(List.of(product));
        when(inventoryTransactions.findFirstByTenantIdAndWarehouseIdAndProductIdOrderByCreatedAtDesc(
            1L,
            1L,
            42L
        )).thenReturn(java.util.Optional.of(InventoryTransaction.builder()
            .tenantId(1L)
            .warehouseId(1L)
            .productId(42L)
            .createdAt(stockChangedAt)
            .build()));

        List<NotificationFeedItem> feed = service.listRecent(
            20,
            authentication("NOTIFICATION_VIEW", "PRODUCT_VIEW", "INVENTORY_VIEW")
        );

        assertThat(feed)
            .filteredOn(item -> item.id().equals("low-stock-501"))
            .singleElement()
            .satisfies(item -> assertThat(item.createdAt()).isEqualTo(stockChangedAt));
    }

    @Test
    void readStateIsIndependentForEachUser() {
        Notification notification = salesNotification(79L, "SALES_ORDER_CANCELLED");
        when(notifications.findByTenantIdAndTypeInOrderByCreatedAtDesc(
            eq(1L),
            any(),
            any(Pageable.class)
        )).thenReturn(List.of(notification));
        when(notificationReads.findByTenantIdAndUserIdAndNotificationKeyIn(
            eq(1L),
            eq(10L),
            anyCollection()
        )).thenReturn(List.of(NotificationRead.builder()
            .tenantId(1L)
            .userId(10L)
            .notificationKey("api:79")
            .build()));
        when(notificationReads.findByTenantIdAndUserIdAndNotificationKeyIn(
            eq(1L),
            eq(20L),
            anyCollection()
        )).thenReturn(List.of());

        List<NotificationFeedItem> ownerFeed = service.listRecent(
            20,
            authentication("NOTIFICATION_VIEW", "SALES_ORDER_VIEW")
        );
        assertThat(ownerFeed).singleElement().satisfies(item -> assertThat(item.readFlag()).isTrue());

        TenantContext.set(1L, 20L);
        List<NotificationFeedItem> warehouseFeed = service.listRecent(
            20,
            authentication("NOTIFICATION_VIEW", "SALES_ORDER_VIEW")
        );
        assertThat(warehouseFeed).singleElement().satisfies(item -> assertThat(item.readFlag()).isFalse());
    }

    private Notification salesNotification(Long id, String type) {
        return Notification.builder()
            .id(id)
            .tenantId(1L)
            .type(type)
            .title("Sales order update")
            .message("Order SO-" + id + " has been updated")
            .createdAt(Instant.parse("2026-09-06T01:00:00Z"))
            .build();
    }

    private CustomerDebtTransaction debt(
        Long id,
        Long customerId,
        String remainingAmount,
        Instant createdAt,
        LocalDate dueDate
    ) {
        return CustomerDebtTransaction.builder()
            .id(id)
            .tenantId(1L)
            .customerId(customerId)
            .direction("INCREASE")
            .remainingAmount(new BigDecimal(remainingAmount))
            .dueDate(dueDate)
            .createdAt(createdAt)
            .build();
    }

    private Customer customer(Long id, String name) {
        return Customer.builder()
            .id(id)
            .tenantId(1L)
            .name(name)
            .active(true)
            .build();
    }

    private Authentication authentication(String... permissions) {
        return new UsernamePasswordAuthenticationToken(
            "test-user",
            "n/a",
            Arrays.stream(permissions).map(SimpleGrantedAuthority::new).toList()
        );
    }
}
