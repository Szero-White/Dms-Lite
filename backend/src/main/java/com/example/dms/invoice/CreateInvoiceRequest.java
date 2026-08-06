package com.example.dms.invoice;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
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
public class CreateInvoiceRequest {

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    private Long salesOrderId;

    @NotNull(message = "Issue date is required")
    private Instant issueDate;

    private Instant dueDate;

    private String taxRate;

    private String notes;

    private String companyName;
    private String companyAddress;
    private String companyTaxCode;
    private String customerName;
    private String customerAddress;
    private String customerTaxCode;

    @Valid
    @NotNull(message = "Invoice items are required")
    private List<InvoiceItemRequest> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InvoiceItemRequest {
        @NotNull(message = "Product ID is required")
        private Long productId;

        private String productName;
        private String productCode;
        private String description;

        @NotNull(message = "Quantity is required")
        @Positive(message = "Quantity must be positive")
        private BigDecimal quantity;

        @NotNull(message = "Unit price is required")
        @Positive(message = "Unit price must be positive")
        private BigDecimal unitPrice;

        private BigDecimal discountAmount;
        private String taxRate;
    }
}