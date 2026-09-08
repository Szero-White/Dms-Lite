package com.example.dms.invoice;

public enum InvoiceSort {
    NEWEST("createdAt"),
    INVOICE_NUMBER("invoiceNumber"),
    CUSTOMER("customerName"),
    STATUS("status"),
    ISSUE_DATE("issueDate"),
    DUE_DATE("dueDate"),
    TOTAL_AMOUNT("totalAmount"),
    PAID_AMOUNT("paidAmount"),
    REMAINING_AMOUNT("remainingAmount");

    private final String property;

    InvoiceSort(String property) {
        this.property = property;
    }

    public String property() {
        return property;
    }
}
