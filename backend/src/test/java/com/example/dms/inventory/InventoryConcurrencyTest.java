package com.example.dms.inventory;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.dms.common.BusinessException;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootTest
class InventoryConcurrencyTest {

    private static final long TEST_TENANT_ID = 9_876_543_211L;
    private static final long TEST_WAREHOUSE_ID = 9_876_543_212L;
    private static final long TEST_PRODUCT_ID = 9_876_543_213L;

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        cleanup();
        jdbcTemplate.update(
            "insert into stock_items(tenant_id, warehouse_id, product_id, quantity_on_hand, version) " +
                "values (?, ?, ?, ?, ?)",
            TEST_TENANT_ID,
            TEST_WAREHOUSE_ID,
            TEST_PRODUCT_ID,
            5,
            0L
        );
    }

    @AfterEach
    void tearDown() {
        cleanup();
    }

    @Test
    void concurrentStockOutCannotMakeInventoryNegative() throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);

        Callable<Boolean> deductFourUnits = () -> {
            ready.countDown();
            if (!start.await(5, TimeUnit.SECONDS)) {
                throw new IllegalStateException("Timed out waiting to start concurrent stock deduction");
            }

            try {
                inventoryService.deduct(
                    TEST_TENANT_ID,
                    TEST_WAREHOUSE_ID,
                    TEST_PRODUCT_ID,
                    4,
                    "CONCURRENCY_TEST",
                    null,
                    "Concurrent stock-out test"
                );
                return true;
            } catch (BusinessException expectedInsufficientStock) {
                return false;
            }
        };

        try {
            Future<Boolean> first = executor.submit(deductFourUnits);
            Future<Boolean> second = executor.submit(deductFourUnits);

            assertThat(ready.await(5, TimeUnit.SECONDS)).isTrue();
            start.countDown();

            List<Boolean> results = List.of(
                first.get(10, TimeUnit.SECONDS),
                second.get(10, TimeUnit.SECONDS)
            );

            assertThat(results).containsExactlyInAnyOrder(true, false);
            assertThat(currentQuantity()).isEqualTo(1);
            assertThat(stockOutTransactionCount()).isEqualTo(1);
        } finally {
            start.countDown();
            executor.shutdownNow();
        }
    }

    private int currentQuantity() {
        Integer quantity = jdbcTemplate.queryForObject(
            "select quantity_on_hand from stock_items " +
                "where tenant_id = ? and warehouse_id = ? and product_id = ?",
            Integer.class,
            TEST_TENANT_ID,
            TEST_WAREHOUSE_ID,
            TEST_PRODUCT_ID
        );
        return quantity == null ? 0 : quantity;
    }

    private int stockOutTransactionCount() {
        Integer count = jdbcTemplate.queryForObject(
            "select count(*) from inventory_transactions " +
                "where tenant_id = ? and warehouse_id = ? and product_id = ? and direction = 'OUT'",
            Integer.class,
            TEST_TENANT_ID,
            TEST_WAREHOUSE_ID,
            TEST_PRODUCT_ID
        );
        return count == null ? 0 : count;
    }

    private void cleanup() {
        jdbcTemplate.update(
            "delete from inventory_transactions where tenant_id = ?",
            TEST_TENANT_ID
        );
        jdbcTemplate.update(
            "delete from stock_items where tenant_id = ?",
            TEST_TENANT_ID
        );
    }
}
