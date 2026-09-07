package com.example.dms.notification;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationReadRepository extends JpaRepository<NotificationRead, Long> {

    List<NotificationRead> findByTenantIdAndUserIdAndNotificationKeyIn(
        Long tenantId,
        Long userId,
        Collection<String> notificationKeys
    );

    @Modifying
    @Query(
        value = "insert into notification_reads (tenant_id, user_id, notification_key, read_at) " +
            "values (:tenantId, :userId, :notificationKey, current_timestamp) " +
            "on conflict (tenant_id, user_id, notification_key) do nothing",
        nativeQuery = true
    )
    int insertIfAbsent(
        @Param("tenantId") Long tenantId,
        @Param("userId") Long userId,
        @Param("notificationKey") String notificationKey
    );

    @Modifying(flushAutomatically = true)
    @Query(
        value = "delete from notification_reads " +
            "where tenant_id = :tenantId and user_id = :userId and notification_key = :notificationKey",
        nativeQuery = true
    )
    int deleteReceipt(
        @Param("tenantId") Long tenantId,
        @Param("userId") Long userId,
        @Param("notificationKey") String notificationKey
    );
}
