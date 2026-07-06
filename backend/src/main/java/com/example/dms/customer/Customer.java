package com.example.dms.customer;
import jakarta.persistence.*;import lombok.*;import java.math.*;import java.time.*;
@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder @Table(name="customers")
public class Customer { @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id; Long tenantId; String name; String phone; String address; BigDecimal creditLimit; Integer paymentTermDays; boolean active; Instant deletedAt; }
