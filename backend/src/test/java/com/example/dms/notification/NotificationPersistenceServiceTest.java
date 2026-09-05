package com.example.dms.notification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class NotificationPersistenceServiceTest {

    private final NotificationRepository notifications = mock(NotificationRepository.class);
    private final NotificationPersistenceService service = new NotificationPersistenceService(notifications);

    @Test
    void suppressesSamePersistedEventDuringRetryWindow() {
        NotificationEvent event = new NotificationEvent(
            1L,
            "SALES_ORDER_CONFIRMED",
            "Order confirmed",
            "Order SO-100 has been confirmed"
        );
        when(notifications.existsByTenantIdAndTypeAndMessageAndCreatedAtAfter(
            eq(1L),
            eq("SALES_ORDER_CONFIRMED"),
            eq("Order SO-100 has been confirmed"),
            any(Instant.class)
        )).thenReturn(true);

        service.store(event);

        verify(notifications, never()).save(any(Notification.class));
    }

    @Test
    void persistsNewBusinessEvent() {
        NotificationEvent event = new NotificationEvent(
            1L,
            "SALES_ORDER_CANCELLED",
            "Order cancelled",
            "Order SO-101 has been cancelled"
        );
        when(notifications.existsByTenantIdAndTypeAndMessageAndCreatedAtAfter(
            eq(1L),
            eq("SALES_ORDER_CANCELLED"),
            eq("Order SO-101 has been cancelled"),
            any(Instant.class)
        )).thenReturn(false);

        service.store(event);

        ArgumentCaptor<Notification> saved = ArgumentCaptor.forClass(Notification.class);
        verify(notifications).save(saved.capture());
        assertThat(saved.getValue().getTenantId()).isEqualTo(1L);
        assertThat(saved.getValue().getType()).isEqualTo("SALES_ORDER_CANCELLED");
        assertThat(saved.getValue().getMessage()).isEqualTo("Order SO-101 has been cancelled");
        assertThat(saved.getValue().isReadFlag()).isFalse();
    }
}
