package com.example.dms.audit;

import java.time.Instant;

public record AuditLogResponse(
    Long id,
    Long actorId,
    String actorName,
    String action,
    String entityType,
    Long entityId,
    String newValue,
    Instant createdAt
) {
}
