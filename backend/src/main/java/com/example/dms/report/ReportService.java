package com.example.dms.report;

import com.example.dms.common.BusinessException;
import com.example.dms.common.TenantContext;
import com.example.dms.debt.CustomerDebtRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReportService {

    private static final int LEADERBOARD_SIZE = 5;

    private final ReportReadRepository reportReadRepository;
    private final CustomerDebtRepository customerDebtRepository;

    @Transactional(readOnly = true)
    @Cacheable(
        value = "dashboard",
        key = "T(com.example.dms.common.TenantContext).tenantRequired()"
    )
    public DashboardReport dashboard() {
        Long tenantId = TenantContext.tenantRequired();
        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);

        return new DashboardReport(
            reportReadRepository.revenueSince(tenantId, today),
            reportReadRepository.revenueSince(tenantId, monthStart),
            customerDebtRepository.totalReceivable(tenantId),
            reportReadRepository.lowStockCount(tenantId),
            reportReadRepository.productCount(tenantId),
            customerDebtRepository.topDebtLeaders(tenantId, PageRequest.of(0, LEADERBOARD_SIZE))
                .stream()
                .map(view -> new DashboardReport.DebtLeader(
                    view.getCustomerId(),
                    view.getCustomerName(),
                    view.getBalance()
                ))
                .toList(),
            reportReadRepository.topSellingProducts(tenantId)
        );
    }

    @Transactional(readOnly = true)
    public SalesReport sales(Instant fromInclusive, Instant toInclusive) {
        if (fromInclusive != null && toInclusive != null && fromInclusive.isAfter(toInclusive)) {
            throw new BusinessException("Report start must not be after report end");
        }

        Long tenantId = TenantContext.tenantRequired();
        var readRows = reportReadRepository.salesOrders(tenantId, fromInclusive, toInclusive);
        var completedOrderIds = readRows.stream()
            .filter(row -> "COMPLETED".equals(row.status()))
            .map(SalesReportReadRow::id)
            .toList();

        Map<Long, CustomerDebtRepository.SalesOrderReceivableView> receivablesByOrderId =
            completedOrderIds.isEmpty()
                ? Map.of()
                : customerDebtRepository.remainingForSalesOrders(tenantId, completedOrderIds)
                    .stream()
                    .collect(Collectors.toMap(
                        CustomerDebtRepository.SalesOrderReceivableView::getSourceId,
                        Function.identity()
                    ));

        var orders = readRows.stream()
            .map(row -> toSalesReportRow(row, receivablesByOrderId.get(row.id())))
            .toList();

        var completedOrders = orders.stream()
            .filter(order -> "COMPLETED".equals(order.status()))
            .toList();
        BigDecimal recognizedRevenue = completedOrders.stream()
            .map(SalesReport.SalesOrderRow::totalAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal averageCompletedOrderValue = completedOrders.isEmpty()
            ? BigDecimal.ZERO
            : recognizedRevenue.divide(
                BigDecimal.valueOf(completedOrders.size()),
                2,
                RoundingMode.HALF_UP
            );

        return new SalesReport(
            new SalesReport.Summary(
                recognizedRevenue,
                orders.size(),
                averageCompletedOrderValue,
                completedOrders.size()
            ),
            orders
        );
    }

    private SalesReport.SalesOrderRow toSalesReportRow(
        SalesReportReadRow row,
        CustomerDebtRepository.SalesOrderReceivableView receivable
    ) {
        boolean completed = "COMPLETED".equals(row.status());
        boolean receivableRecognized = completed && receivable != null;

        if (!receivableRecognized) {
            return new SalesReport.SalesOrderRow(
                row.id(),
                row.code(),
                row.customerId(),
                row.customerName(),
                row.status(),
                row.totalAmount(),
                null,
                null,
                null,
                false,
                row.reportDate(),
                row.createdAt(),
                row.confirmedAt()
            );
        }

        BigDecimal remainingReceivable = receivable.getRemainingAmount().max(BigDecimal.ZERO);
        BigDecimal collectedAmount = row.totalAmount()
            .subtract(remainingReceivable)
            .max(BigDecimal.ZERO)
            .min(row.totalAmount());
        int collectionProgress = row.totalAmount().signum() <= 0
            ? 100
            : collectedAmount
                .multiply(BigDecimal.valueOf(100))
                .divide(row.totalAmount(), 0, RoundingMode.HALF_UP)
                .intValue();

        return new SalesReport.SalesOrderRow(
            row.id(),
            row.code(),
            row.customerId(),
            row.customerName(),
            row.status(),
            row.totalAmount(),
            collectedAmount,
            remainingReceivable,
            Math.min(100, Math.max(0, collectionProgress)),
            true,
            row.reportDate(),
            row.createdAt(),
            row.confirmedAt()
        );
    }
}
