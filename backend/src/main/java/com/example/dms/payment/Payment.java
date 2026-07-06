package com.example.dms.payment;
import jakarta.persistence.*;import lombok.*;import java.math.*;import java.time.*;
@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder @Table(name="payments")
public class Payment { @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id; Long tenantId; Long customerId; BigDecimal amount; String note; Long createdBy; Instant createdAt; @PrePersist void pre(){createdAt=Instant.now();} }
