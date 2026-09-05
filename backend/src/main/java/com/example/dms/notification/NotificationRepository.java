package com.example.dms.notification;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByTenantIdAndTypeInOrderByCreatedAtDesc(
        Long tenantId,
        Collection<String> types,
        Pageable pageable
    );

    boolean existsByTenantIdAndTypeAndMessageAndCreatedAtAfter(
        Long tenantId,
        String type,
        String message,
        Instant createdAfter
    );

    Optional<Notification> findByIdAndTenantId(Long id, Long tenantId);
}
