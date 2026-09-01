package com.example.dms.report;

import com.example.dms.common.TenantContext;
import com.example.dms.debt.CustomerDebtRepository;
import java.time.LocalDate;
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
}
