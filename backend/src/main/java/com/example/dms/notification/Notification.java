package com.example.dms.notification;
import jakarta.persistence.*;import lombok.*;import java.time.*;
@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder @Table(name="notifications")
public class Notification { @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id; Long tenantId; String type; String title; @Column(columnDefinition="text") String message; boolean readFlag; Instant createdAt; @PrePersist void pre(){createdAt=Instant.now();} }
