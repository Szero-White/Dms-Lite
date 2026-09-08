package com.example.dms.payment;

public enum PaymentHistorySort {
    NEWEST("createdAt"),
    PAYMENT_CODE("code"),
    SALES_ORDER("salesOrderCodeSnapshot"),
    CUSTOMER("customerNameSnapshot"),
    AMOUNT("amount"),
    DEBT_AFTER("debtAfter"),
    NOTE("note");

    private final String property;

    PaymentHistorySort(String property) {
        this.property = property;
    }

    public String property() {
        return property;
    }
}
