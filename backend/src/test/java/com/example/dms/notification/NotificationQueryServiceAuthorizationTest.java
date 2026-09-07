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
import com.example.dms.inventory.StockItem;
import com.example.dms.inventory.StockItemRepository;
import com.example.dms.product.Product;
import com.example.dms.product.ProductRepository;
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
    private final ProductRepository products = mock(ProductRepository.class);
    private final CustomerDebtRepository debts = mock(CustomerDebtRepository.class);
    private final CustomerRepository customers = mock(CustomerRepository.class);
    private final BusinessTimeProvider businessTimeProvider = mock(BusinessTimeProvider.class);
    private final NotificationQueryService service = new NotificationQueryService(
        notifications,
        notificationReads,
        stockItems,
        products,
        debts,
        customers,
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
    void cashierFeedQueriesOnlyPaymentPersistedNotifications() {
        when(notifications.findByTenantIdAndTypeInOrderByCreatedAtDesc(
            eq(1L),
            any(),
            any(Pageable.class)
        )).thenReturn(List.of());

        service.listRecent(20, authentication("NOTIFICATION_VIEW", "CUSTOMER_VIEW", "PAYMENT_CREATE"));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Collection<String>> types = ArgumentCaptor.forClass(Collection.class);
        verify(notifications).findByTenantIdAndTypeInOrderByCreatedAtDesc(
            eq(1L),
            types.capture(),
            any(Pageable.class)
        );

        assertThat(types.getValue()).containsExactlyInAnyOrder("PAYMENT_RECORDED");
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
        when(debts.overdue(eq(1L), any(), any(Pageable.class))).thenReturn(List.of(
            debt(101L, 5L, "100000", firstCreatedAt),
            debt(102L, 5L, "50000", secondCreatedAt),
            debt(103L, 6L, "75000", secondCreatedAt)
        ));
        when(customers.findAllById(any())).thenReturn(List.of(
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
            .satisfies(item -> assertThat(item.message()).contains("150,000 VND"));
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
        when(products.findAllById(any())).thenReturn(List.of(product));

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
            .readFlag(false)
            .createdAt(Instant.parse("2026-09-06T01:00:00Z"))
            .build();
    }

    private CustomerDebtTransaction debt(Long id, Long customerId, String remainingAmount, Instant createdAt) {
        return CustomerDebtTransaction.builder()
            .id(id)
            .tenantId(1L)
            .customerId(customerId)
            .direction("INCREASE")
            .remainingAmount(new BigDecimal(remainingAmount))
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
