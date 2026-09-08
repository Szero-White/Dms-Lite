package com.example.dms.common;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class PageRequestPolicyTest {

    @Test
    void normalizesNegativePageToZero() {
        assertEquals(0, PageRequestPolicy.page(-3));
        assertEquals(4, PageRequestPolicy.page(4));
    }

    @Test
    void usesDefaultSizeForNonPositiveRequests() {
        assertEquals(PageRequestPolicy.DEFAULT_PAGE_SIZE, PageRequestPolicy.size(0));
        assertEquals(PageRequestPolicy.DEFAULT_PAGE_SIZE, PageRequestPolicy.size(-1));
    }

    @Test
    void capsRequestedSize() {
        assertEquals(50, PageRequestPolicy.size(50));
        assertEquals(PageRequestPolicy.MAX_PAGE_SIZE, PageRequestPolicy.size(500));
    }
}
