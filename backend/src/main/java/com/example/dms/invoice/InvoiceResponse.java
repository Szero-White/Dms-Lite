package com.example.dms.invoice;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceResponse {
    private Long id;
    private String invoiceNumber;
    private Long customerId;
    private Long salesOrderId;
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
    private String customerName;
    private Instant createdAt;
    private Instant updatedAt;
    private List<InvoiceItemResponse> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InvoiceItemResponse {
        private Long id;
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
    }
}