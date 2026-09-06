package com.example.dms.invoice;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record InvoiceResponse(
    Long id,
    String invoiceNumber,
    Long customerId,
    String customerName,
    Long salesOrderId,
    String salesOrderCode,
    String status,
    Instant issueDate,
    Instant dueDate,
    BigDecimal subtotal,
    BigDecimal taxAmount,
    BigDecimal discountAmount,
    BigDecimal totalAmount,
    BigDecimal paidAmount,
    BigDecimal remainingAmount,
    String notes,
    String companyName,
    Instant createdAt,
    Instant updatedAt,
    List<InvoiceItemResponse> items
) {
    public record InvoiceItemResponse(
        Long id,
        Long productId,
        String productName,
        String productCode,
        BigDecimal quantity,
        BigDecimal unitPrice,
        BigDecimal discountAmount,
        BigDecimal taxAmount,
        BigDecimal lineTotal
    ) {
    }
}
