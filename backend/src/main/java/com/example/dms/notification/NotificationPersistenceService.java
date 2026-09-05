package com.example.dms.notification;

import java.time.Duration;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Central write path for persisted notifications.
 *
 * The short duplicate window protects the feed from retry/double-delivery noise without
 * turning notification persistence into a broad business-event throttle.
 */
@Service
@RequiredArgsConstructor
public class NotificationPersistenceService {

    private static final Duration DUPLICATE_SUPPRESSION_WINDOW = Duration.ofMinutes(5);

    private final NotificationRepository notificationRepository;

    @Transactional
    public void store(NotificationEvent event) {
        Instant duplicateCutoff = Instant.now().minus(DUPLICATE_SUPPRESSION_WINDOW);
        boolean duplicate = notificationRepository.existsByTenantIdAndTypeAndMessageAndCreatedAtAfter(
            event.tenantId(),
            event.type(),
            event.message(),
            duplicateCutoff
        );

        if (duplicate) {
            return;
        }

        notificationRepository.save(
            Notification.builder()
                .tenantId(event.tenantId())
                .type(event.type())
                .title(event.title())
                .message(event.message())
                .readFlag(false)
                .build()
        );
    }
}
