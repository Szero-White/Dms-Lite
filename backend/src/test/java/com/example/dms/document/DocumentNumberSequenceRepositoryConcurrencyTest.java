package com.example.dms.document;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootTest
class DocumentNumberSequenceRepositoryConcurrencyTest {

    private static final long TEST_TENANT = 9_876_543_210L;
    private static final LocalDate TEST_DATE = LocalDate.of(2099, 1, 1);

    @Autowired
    private DocumentNumberSequenceRepository repository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void cleanBefore() {
        cleanup();
    }

    @AfterEach
    void cleanup() {
        jdbcTemplate.update(
            "delete from document_number_sequences where tenant_id = ?",
            TEST_TENANT
        );
    }

    @Test
    void allocatesUniqueMonotonicValuesUnderConcurrentRequests() throws Exception {
        int requestCount = 20;
        ExecutorService executor = Executors.newFixedThreadPool(8);
        try {
            List<Callable<Integer>> tasks = new ArrayList<>();
            for (int i = 0; i < requestCount; i++) {
                tasks.add(() -> repository.nextValue(
                    TEST_TENANT,
                    DocumentNumberType.SALES_ORDER,
                    TEST_DATE
                ));
            }

            List<Integer> values = new ArrayList<>();
            for (Future<Integer> future : executor.invokeAll(tasks)) {
                values.add(future.get());
            }

            assertThat(values)
                .doesNotHaveDuplicates()
                .containsExactlyInAnyOrderElementsOf(
                    java.util.stream.IntStream.rangeClosed(1, requestCount).boxed().toList()
                );
        } finally {
            executor.shutdownNow();
        }
    }
}
