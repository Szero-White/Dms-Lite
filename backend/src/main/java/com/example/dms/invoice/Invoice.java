package com.example.dms.invoice;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "invoices")
public class Invoice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long tenantId;
    private Long customerId;
    private Long salesOrderId;

    @Column(unique = true)
    private String invoiceNumber;

    private String status;
    private Instant issueDate;
    private Instant dueDate;
    private BigDecimal subtotal;
    private BigDecimal taxAmount;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private BigDecimal remainingAmount;
    private String taxRate;
    private String notes;
    private String companyName;
    private String companyAddress;
    private String companyTaxCode;
    private String customerName;
    private String customerAddress;
    private String customerTaxCode;
    private Long createdBy;
    private Instant createdAt;
    private Instant updatedAt;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<InvoiceItem> items = new ArrayList<>();

    @PrePersist
    void onPrePersist() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    void onPreUpdate() {
        updatedAt = Instant.now();
    }
}
