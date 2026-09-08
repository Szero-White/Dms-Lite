package com.example.dms.common;

public final class PageRequestPolicy {

    public static final int DEFAULT_PAGE_SIZE = 20;
    public static final int MAX_PAGE_SIZE = 100;

    private PageRequestPolicy() {
    }

    public static int page(int requestedPage) {
        return Math.max(requestedPage, 0);
    }

    public static int size(int requestedSize) {
        if (requestedSize <= 0) {
            return DEFAULT_PAGE_SIZE;
        }
        return Math.min(requestedSize, MAX_PAGE_SIZE);
    }
}
