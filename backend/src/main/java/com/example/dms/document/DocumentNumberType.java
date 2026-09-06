package com.example.dms.document;

public enum DocumentNumberType {
    SALES_ORDER("SO"),
    INVOICE("INV"),
    PAYMENT("PAY");

    private final String prefix;

    DocumentNumberType(String prefix) {
        this.prefix = prefix;
    }

    public String prefix() {
        return prefix;
    }
}
