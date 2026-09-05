package com.example.dms.notification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.dms.common.BusinessException;
import com.example.dms.common.TenantContext;
import com.example.dms.customer.Customer;
import com.example.dms.customer.CustomerRepository;
import com.example.dms.debt.CustomerDebtRepository;
import com.example.dms.debt.CustomerDebtTransaction;
import com.example.dms.inventory.StockItemRepository;
import com.example.dms.product.ProductRepository;
import java.math.BigDecimal;
import java.time.Instant;
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
    private final CustomerDebtRepository debts = mock(CustomerDebtRepository.class);
    private final CustomerRepository customers = mock(CustomerRepository.class);
    private final NotificationQueryService service = new NotificationQueryService(
        notifications,
        mock(StockItemRepository.class),
        mock(ProductRepository.class),
        debts,
        customers
    );

    @BeforeEach
    void setTenant() {
        TenantContext.set(1L, 10L);
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
        Notification notification = Notification.builder()
            .id(77L)
            .tenantId(1L)
            .type("SALES_ORDER_CANCELLED")
            .title("Order cancelled")
            .message("Order SO-77 has been cancelled")
            .readFlag(false)
            .build();
        when(notifications.findByIdAndTenantId(77L, 1L)).thenReturn(java.util.Optional.of(notification));

        assertThatThrownBy(() -> service.markRead(
            77L,
            authentication("NOTIFICATION_VIEW", "CUSTOMER_VIEW", "PAYMENT_CREATE")
        ))
            .isInstanceOf(BusinessException.class)
            .hasMessage("Notification not found");

        assertThat(notification.isReadFlag()).isFalse();
    }

    @Test
    void salesViewerCanMarkSalesNotificationAsRead() {
        Notification notification = Notification.builder()
            .id(78L)
            .tenantId(1L)
            .type("SALES_ORDER_CONFIRMED")
            .title("Order confirmed")
            .message("Order SO-78 has been confirmed")
            .readFlag(false)
            .build();
        when(notifications.findByIdAndTenantId(78L, 1L)).thenReturn(java.util.Optional.of(notification));

        service.markRead(78L, authentication("NOTIFICATION_VIEW", "SALES_ORDER_VIEW"));

        assertThat(notification.isReadFlag()).isTrue();
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
