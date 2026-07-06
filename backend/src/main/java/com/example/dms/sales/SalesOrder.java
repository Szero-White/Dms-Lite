package com.example.dms.sales;
import jakarta.persistence.*;import lombok.*;import java.math.*;import java.time.*;import java.util.*;
@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder @Table(name="sales_orders")
public class SalesOrder { @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id; Long tenantId; Long customerId; Long warehouseId; @Column(unique=true) String code; String status; BigDecimal totalAmount; BigDecimal paidAmount; BigDecimal debtAmount; Instant createdAt; Instant confirmedAt; @OneToMany(mappedBy="order",cascade=CascadeType.ALL,orphanRemoval=true) @Builder.Default List<SalesOrderItem> items=new ArrayList<>(); @PrePersist void pre(){createdAt=Instant.now();} }
