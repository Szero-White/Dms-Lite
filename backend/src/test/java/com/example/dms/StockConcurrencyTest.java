package com.example.dms;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

/**
 * Database concurrency integration-test scenario template:
 * - seed stock = 5
 * - create 2 draft orders, each quantity = 4
 * - confirm both concurrently
 * - expect one success, one fail
 * - final stock must not be negative
 *
 * Enable and complete this test in a dedicated PostgreSQL integration-test environment.
 */
@Disabled("Template for the middle-level concurrency test")
class StockConcurrencyTest {
  @Test void concurrentConfirmMustNotMakeStockNegative() {}
}
