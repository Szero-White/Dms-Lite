package com.example.dms.sales;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "sales_orders")
public class SalesOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long tenantId;
    private Long customerId;
    private Long warehouseId;

    @Column(unique = true)
    private String code;

    private String status;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private BigDecimal debtAmount;
    private Instant createdAt;
    private Instant confirmedAt;

    @OneToMany(
        mappedBy = "order",
        cascade = CascadeType.ALL,
        orphanRemoval = true,
        fetch = FetchType.LAZY
    )
    @Builder.Default
    private List<SalesOrderItem> items = new ArrayList<>();

    @PrePersist
    void onPrePersist() {
        createdAt = Instant.now();
    }
}
