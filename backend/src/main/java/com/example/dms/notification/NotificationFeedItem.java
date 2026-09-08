package com.example.dms.notification;

import java.time.Instant;

public record NotificationFeedItem(
    String id,
    String type,
    String title,
    String message,
    boolean readFlag,
    Instant createdAt,
    String source
) {
}
