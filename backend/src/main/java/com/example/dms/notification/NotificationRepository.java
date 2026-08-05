package com.example.dms.notification;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByTenantIdOrderByCreatedAtDesc(Long tenantId, Pageable pageable);

    Optional<Notification> findByIdAndTenantId(Long id, Long tenantId);
}
