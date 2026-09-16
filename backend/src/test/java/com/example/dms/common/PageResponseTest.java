package com.example.dms.common;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

class PageResponseTest {

    @Test
    void mapsSpringPageToStableApiContract() {
        PageImpl<String> page = new PageImpl<>(
            List.of("item-a", "item-b"),
            PageRequest.of(2, 2),
            7
        );

        PageResponse<String> response = PageResponse.from(page);

        assertThat(response.content()).containsExactly("item-a", "item-b");
        assertThat(response.totalElements()).isEqualTo(7);
        assertThat(response.totalPages()).isEqualTo(4);
        assertThat(response.size()).isEqualTo(2);
        assertThat(response.number()).isEqualTo(2);
    }
}
