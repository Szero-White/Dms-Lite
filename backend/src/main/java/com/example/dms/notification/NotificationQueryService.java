package com.example.dms.notification;

import com.example.dms.common.BusinessException;
import com.example.dms.common.TenantContext;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationQueryService {

    private static final int MAX_FEED_SIZE = 50;

    private static final int API_NOTIFICATION_LIMIT = 20;

    private static final String API_SOURCE = "api";

    private final NotificationRepository notificationRepository;

    private final NotificationReadRepository notificationReads;

    private final DerivedNotificationService derivedNotifications;

    @Transactional(readOnly = true)
    public List<NotificationFeedItem> listRecent(int size, Authentication authentication) {
        Long tenantId = TenantContext.tenantRequired();
        Long userId = userRequired();
        Set<String> permissions = permissions(authentication);
        int boundedSize = Math.min(Math.max(size, 1), MAX_FEED_SIZE);
        List<NotificationFeedItem> feed = buildVisibleFeed(tenantId, permissions, boundedSize);

        return applyPerUserReadState(feed, tenantId, userId);
    }

    @Transactional
    public void setReadState(String notificationId, boolean read, Authentication authentication) {
        Long tenantId = TenantContext.tenantRequired();
        Long userId = userRequired();
        Set<String> permissions = permissions(authentication);
        NotificationFeedItem item = resolveVisibleNotification(notificationId, tenantId, permissions);
        String notificationKey = readStateKey(item);

        if (read) {
            notificationReads.insertIfAbsent(tenantId, userId, notificationKey);
        } else {
            notificationReads.deleteReceipt(tenantId, userId, notificationKey);
        }
    }

    private List<NotificationFeedItem> buildVisibleFeed(Long tenantId, Set<String> permissions, int size) {
        List<NotificationFeedItem> feed = new ArrayList<>();
        feed.addAll(apiNotifications(tenantId, permissions));
        feed.addAll(derivedNotifications.listVisible(tenantId, permissions));

        return feed.stream()
            .sorted(
                Comparator.comparing(NotificationFeedItem::createdAt)
                    .reversed()
                    .thenComparing(NotificationFeedItem::id)
            )
            .limit(size)
            .toList();
    }

    private NotificationFeedItem resolveVisibleNotification(
        String notificationId,
        Long tenantId,
        Set<String> permissions
    ) {
        if (notificationId.matches("\\d+")) {
            try {
                Long persistedId = Long.valueOf(notificationId);
                Notification notification = notificationRepository.findByIdAndTenantId(persistedId, tenantId)
                    .orElseThrow(() -> new BusinessException("Notification not found"));
                if (!NotificationPermissionPolicy.canView(notification.getType(), permissions)) {
                    throw new BusinessException("Notification not found");
                }
                return persistedNotificationItem(notification);
            } catch (NumberFormatException exception) {
                throw new BusinessException("Notification not found");
            }
        }

        return derivedNotifications.listVisible(tenantId, permissions)
            .stream()
            .filter(candidate -> candidate.id().equals(notificationId))
            .findFirst()
            .orElseThrow(() -> new BusinessException("Notification not found"));
    }

    private List<NotificationFeedItem> applyPerUserReadState(
        List<NotificationFeedItem> feed,
        Long tenantId,
        Long userId
    ) {
        if (feed.isEmpty()) {
            return feed;
        }

        Set<String> keys = feed.stream()
            .map(this::readStateKey)
            .collect(Collectors.toSet());
        Set<String> readKeys = notificationReads.findByTenantIdAndUserIdAndNotificationKeyIn(
                tenantId,
                userId,
                keys
            )
            .stream()
            .map(NotificationRead::getNotificationKey)
            .collect(Collectors.toCollection(HashSet::new));

        return feed.stream()
            .map(item -> new NotificationFeedItem(
                item.id(),
                item.type(),
                item.title(),
                item.message(),
                readKeys.contains(readStateKey(item)),
                item.createdAt(),
                item.source()
            ))
            .toList();
    }

    private String readStateKey(NotificationFeedItem item) {
        if (API_SOURCE.equals(item.source())) {
            return API_SOURCE + ":" + item.id();
        }

        // Derived notifications do not own a persisted event row. Version the receipt
        // by business content so a material state change becomes unread again.
        String fingerprintSource = item.type() + "\n" + item.message();
        return DerivedNotificationService.SOURCE + ":" + item.id() + ":" + shortSha256(fingerprintSource);
    }

    private String shortSha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                .digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest, 0, 12);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    private Long userRequired() {
        Long userId = TenantContext.user();
        if (userId == null) {
            throw new IllegalStateException("Missing authenticated user");
        }
        return userId;
    }

    private List<NotificationFeedItem> apiNotifications(Long tenantId, Set<String> permissions) {
        Set<String> allowedTypes = NotificationPermissionPolicy.allowedPersistedTypes(permissions);
        if (allowedTypes.isEmpty()) {
            return List.of();
        }

        return notificationRepository.findByTenantIdAndTypeInOrderByCreatedAtDesc(
                tenantId,
                allowedTypes,
                PageRequest.of(0, API_NOTIFICATION_LIMIT)
            )
            .stream()
            .map(this::persistedNotificationItem)
            .toList();
    }

    private NotificationFeedItem persistedNotificationItem(Notification notification) {
        return new NotificationFeedItem(
            String.valueOf(notification.getId()),
            notification.getType(),
            notification.getTitle(),
            notification.getMessage(),
            false,
            notification.getCreatedAt(),
            API_SOURCE
        );
    }

    private Set<String> permissions(Authentication authentication) {
        return authentication.getAuthorities()
            .stream()
            .map(GrantedAuthority::getAuthority)
            .collect(Collectors.toSet());
    }
}
