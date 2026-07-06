package com.example.dms.debt;
import jakarta.persistence.*;import lombok.*;import java.math.*;import java.time.*;
@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder @Table(name="customer_debt_transactions")
public class CustomerDebtTransaction { @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id; Long tenantId; Long customerId; String sourceType; Long sourceId; String direction; BigDecimal amount; BigDecimal remainingAmount; LocalDate dueDate; String note; Long createdBy; Instant createdAt; @PrePersist void pre(){createdAt=Instant.now();} }
