package com.example.dms.notification;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(
    name = "notification_reads",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_notification_reads_user_key",
        columnNames = {"tenant_id", "user_id", "notification_key"}
    )
)
public class NotificationRead {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long tenantId;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, length = 255)
    private String notificationKey;

    @Column(nullable = false)
    private Instant readAt;

    @PrePersist
    void onPrePersist() {
        if (readAt == null) {
            readAt = Instant.now();
        }
    }
}
