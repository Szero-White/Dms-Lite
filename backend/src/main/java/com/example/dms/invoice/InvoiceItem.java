package com.example.dms.invoice;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "invoice_items")
public class InvoiceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long tenantId;
    private Long productId;
    private String productName;
    private String productCode;
    private String description;

    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal discountAmount;
    private String taxRate;
    private BigDecimal taxAmount;
    private BigDecimal lineTotal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id")
    private Invoice invoice;

    @PrePersist
    void onPrePersist() {
        if (lineTotal == null) {
            calculateLineTotal();
        }
    }

    private void calculateLineTotal() {
        BigDecimal lineSubtotal = unitPrice.multiply(quantity);
        BigDecimal afterDiscount = lineSubtotal.subtract(discountAmount != null ? discountAmount : BigDecimal.ZERO);
        this.lineTotal = afterDiscount.add(taxAmount != null ? taxAmount : BigDecimal.ZERO);
    }
}