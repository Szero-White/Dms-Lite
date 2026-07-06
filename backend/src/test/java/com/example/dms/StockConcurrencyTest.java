package com.example.dms;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

/**
 * Testcontainers scenario template:
 * - seed stock = 5
 * - create 2 draft orders, each quantity = 4
 * - confirm both concurrently
 * - expect one success, one fail
 * - final stock must not be negative
 *
 * Enable and complete this test when Docker/Testcontainers is available locally.
 */
@Disabled("Template for the middle-level concurrency test")
class StockConcurrencyTest {
  @Test void concurrentConfirmMustNotMakeStockNegative() {}
}
