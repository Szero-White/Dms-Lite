package com.example.dms.report;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.example.dms.common.BusinessTimeProvider;
import com.example.dms.common.TenantContext;
import com.example.dms.debt.CustomerDebtRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock private ReportReadRepository reportReadRepository;
    @Mock private DashboardReadRepository dashboardReadRepository;
    @Mock private CustomerDebtRepository customerDebtRepository;
    @Mock private BusinessTimeProvider businessTimeProvider;

    private ReportService reportService;

    @BeforeEach
    void setUp() {
        reportService = new ReportService(
            reportReadRepository,
            dashboardReadRepository,
            customerDebtRepository,
            businessTimeProvider
        );
        TenantContext.set(1L, 10L);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }


    @Test
    void receivableAttentionUsesBusinessDateAndThreeDayWarningWindow() {
        LocalDate today = LocalDate.of(2026, 9, 8);
        ReceivableAttentionReport attention = new ReceivableAttentionReport(
            new BigDecimal("80000"),
            1,
            new BigDecimal("250000"),
            2,
            new BigDecimal("960000"),
            1,
            new ReceivableAttentionReport.OverduePreview(
                201L,
                "SO-20260907-0004",
                2L,
                "Tap hoa Co Lan",
                new BigDecimal("80000"),
                LocalDate.of(2026, 9, 7),
                1
            )
        );

        when(businessTimeProvider.today()).thenReturn(today);
        when(dashboardReadRepository.receivableAttention(1L, today, LocalDate.of(2026, 9, 11)))
            .thenReturn(attention);

        ReceivableAttentionReport result = reportService.receivableAttention();

        assertThat(result).isEqualTo(attention);
        assertThat(result.oldestOverdue().daysOverdue()).isEqualTo(1);
    }

    @Test
    void draftOrderDoesNotBecomeAccountingReceivableInSalesReport() {
        SalesReportReadRow draft = new SalesReportReadRow(
            101L,
            "SO-DRAFT",
            2L,
            "Bach hoa Hong Phuc",
            "DRAFT",
            new BigDecimal("3800000"),
            Instant.parse("2026-09-05T07:59:00Z"),
            Instant.parse("2026-09-05T07:59:00Z"),
            null
        );
        when(reportReadRepository.salesOrders(1L, null, null)).thenReturn(List.of(draft));

        SalesReport report = reportService.sales(null, null);

        assertThat(report.summary().recognizedRevenue()).isEqualByComparingTo("0");
        assertThat(report.summary().totalOrders()).isEqualTo(1);
        assertThat(report.summary().completedOrders()).isZero();
        assertThat(report.orders()).singleElement().satisfies(row -> {
            assertThat(row.totalAmount()).isEqualByComparingTo("3800000");
            assertThat(row.reportDate()).isEqualTo(Instant.parse("2026-09-05T07:59:00Z"));
            assertThat(row.receivableRecognized()).isFalse();
            assertThat(row.collectedAmount()).isNull();
            assertThat(row.remainingReceivable()).isNull();
            assertThat(row.collectionProgress()).isNull();
        });
    }

    @Test
    void completedOrderUsesReceivableLedgerForCollectedAndRemainingAmounts() {
        SalesReportReadRow completed = new SalesReportReadRow(
            102L,
            "SO-COMPLETED",
            2L,
            "Bach hoa Hong Phuc",
            "COMPLETED",
            new BigDecimal("160000"),
            Instant.parse("2026-09-05T06:00:00Z"),
            Instant.parse("2026-09-05T05:47:00Z"),
            Instant.parse("2026-09-05T06:00:00Z")
        );
        when(reportReadRepository.salesOrders(1L, null, null)).thenReturn(List.of(completed));
        when(customerDebtRepository.remainingForSalesOrders(1L, List.of(102L)))
            .thenReturn(List.of(receivableView(102L, new BigDecimal("120000"))));

        SalesReport report = reportService.sales(null, null);

        assertThat(report.summary().recognizedRevenue()).isEqualByComparingTo("160000");
        assertThat(report.summary().averageCompletedOrderValue()).isEqualByComparingTo("160000.00");
        assertThat(report.summary().completedOrders()).isEqualTo(1);
        assertThat(report.orders()).singleElement().satisfies(row -> {
            assertThat(row.reportDate()).isEqualTo(Instant.parse("2026-09-05T06:00:00Z"));
            assertThat(row.receivableRecognized()).isTrue();
            assertThat(row.collectedAmount()).isEqualByComparingTo("40000");
            assertThat(row.remainingReceivable()).isEqualByComparingTo("120000");
            assertThat(row.collectionProgress()).isEqualTo(25);
        });
    }

    @Test
    void cancelledOrderDoesNotBecomeRevenueOrReceivable() {
        SalesReportReadRow cancelled = new SalesReportReadRow(
            103L,
            "SO-CANCELLED",
            2L,
            "Bach hoa Hong Phuc",
            "CANCELLED",
            new BigDecimal("250000"),
            Instant.parse("2026-09-05T08:30:00Z"),
            Instant.parse("2026-09-05T08:30:00Z"),
            null
        );
        when(reportReadRepository.salesOrders(1L, null, null)).thenReturn(List.of(cancelled));

        SalesReport report = reportService.sales(null, null);

        assertThat(report.summary().recognizedRevenue()).isEqualByComparingTo("0");
        assertThat(report.summary().completedOrders()).isZero();
        assertThat(report.orders()).singleElement().satisfies(row -> {
            assertThat(row.reportDate()).isEqualTo(Instant.parse("2026-09-05T08:30:00Z"));
            assertThat(row.receivableRecognized()).isFalse();
            assertThat(row.collectedAmount()).isNull();
            assertThat(row.remainingReceivable()).isNull();
            assertThat(row.collectionProgress()).isNull();
        });
    }

    private CustomerDebtRepository.SalesOrderReceivableView receivableView(
        Long sourceId,
        BigDecimal remainingAmount
    ) {
        return new CustomerDebtRepository.SalesOrderReceivableView() {
            @Override
            public Long getSourceId() {
                return sourceId;
            }

            @Override
            public BigDecimal getRemainingAmount() {
                return remainingAmount;
            }
        };
    }
}
