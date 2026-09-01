package com.example.dms.report;

import java.math.BigDecimal;
import java.util.List;

public record DashboardReport(
    BigDecimal revenueToday,
    BigDecimal revenueThisMonth,
    BigDecimal totalReceivable,
    long lowStockItems,
    long productCount,
    List<DebtLeader> topCustomersByDebt,
    List<TopSellingProduct> topSellingProducts
) {
    public record DebtLeader(
        Long customerId,
        String customerName,
        BigDecimal debtBalance
    ) {
    }

    public record TopSellingProduct(
        Long productId,
        String productName,
        long totalQuantity,
        BigDecimal revenue
    ) {
    }
}
