package com.example.dms.audit;
import jakarta.persistence.*;import lombok.*;import java.time.*;
@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder @Table(name="audit_logs")
public class AuditLog { @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id; Long tenantId; Long actorId; String action; String entityType; Long entityId; @Column(columnDefinition="text") String newValue; Instant createdAt; @PrePersist void pre(){createdAt=Instant.now();} }
