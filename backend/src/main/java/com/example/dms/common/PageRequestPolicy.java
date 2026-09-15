package com.example.dms.common;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

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

    /**
     * Default ordering for entities that do not yet expose a createdAt column.
     * Identity values are monotonic in PostgreSQL, so newest inserts appear first.
     */
    public static PageRequest newestById(int requestedPage, int requestedSize) {
        return PageRequest.of(
            page(requestedPage),
            size(requestedSize),
            Sort.by(Sort.Order.desc("id"))
        );
    }

    /**
     * Default ordering for chronological records. The id tie-breaker keeps
     * pagination deterministic when multiple rows have the same timestamp.
     */
    public static PageRequest newestByCreatedAt(int requestedPage, int requestedSize) {
        return PageRequest.of(
            page(requestedPage),
            size(requestedSize),
            Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))
        );
    }
}
