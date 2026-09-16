package com.example.dms.common;

import java.util.List;
import org.springframework.data.domain.Page;

/**
 * Stable API pagination contract.
 *
 * Spring Data {@link Page} is an internal framework type whose JSON shape is not
 * guaranteed to stay stable. Controllers expose this DTO instead so frontend and
 * external clients depend only on fields owned by DMS Lite.
 */
public record PageResponse<T>(
    List<T> content,
    long totalElements,
    int totalPages,
    int size,
    int number
) {

    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(
            List.copyOf(page.getContent()),
            page.getTotalElements(),
            page.getTotalPages(),
            page.getSize(),
            page.getNumber()
        );
    }
}
