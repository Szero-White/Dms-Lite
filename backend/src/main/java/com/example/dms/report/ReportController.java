package com.example.dms.report;

import com.example.dms.common.ApiResponse;
import com.example.dms.common.TenantContext;
import com.example.dms.debt.CustomerDebtRepository;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final EntityManager entityManager;

    private final CustomerDebtRepository customerDebtRepository;

    public record Dashboard(
        BigDecimal revenueToday,
        BigDecimal revenueThisMonth,
        BigDecimal totalReceivable,
        BigDecimal payableDebt,
        long lowStockItems,
        long productCount,
        List<DebtLeader> topCustomersByDebt,
        List<TopSellingProduct> topSellingProducts
    ) {
    }

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

    @GetMapping("/dashboard")
    @PreAuthorize("hasAuthority('REPORT_VIEW')")
    @Cacheable(value = "dashboard", key = "T(com.example.dms.common.TenantContext).tenantRequired()")
    public ApiResponse<Dashboard> dashboard() {
        Long tenantId = TenantContext.tenantRequired();
        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);

        return ApiResponse.ok(
            new Dashboard(
                revenueSince(tenantId, today),
                revenueSince(tenantId, monthStart),
                customerDebtRepository.totalReceivable(tenantId),
                BigDecimal.ZERO,
                lowStockCount(tenantId),
                productCount(tenantId),
                topCustomersByDebt(tenantId),
                topSellingProducts(tenantId)
            )
        );
    }

    private BigDecimal revenueSince(Long tenantId, LocalDate date) {
        return (BigDecimal) entityManager.createNativeQuery(
            "select coalesce(sum(total_amount),0) " +
            "from sales_orders " +
            "where tenant_id=:tenantId and status='COMPLETED' and created_at >= :since"
        )
            .setParameter("tenantId", tenantId)
            .setParameter("since", date.atStartOfDay())
            .getSingleResult();
    }

    private long productCount(Long tenantId) {
        Number count = (Number) entityManager.createNativeQuery(
            "select count(*) from products where tenant_id=:tenantId and deleted_at is null"
        )
            .setParameter("tenantId", tenantId)
            .getSingleResult();

        return count.longValue();
    }

    private long lowStockCount(Long tenantId) {
        Number count = (Number) entityManager.createNativeQuery(
            "select count(*) " +
            "from stock_items s " +
            "join products p on p.id = s.product_id " +
            "where s.tenant_id=:tenantId and p.tenant_id=:tenantId " +
            "and p.deleted_at is null and s.quantity_on_hand <= p.min_stock"
        )
            .setParameter("tenantId", tenantId)
            .getSingleResult();

        return count.longValue();
    }

    private List<DebtLeader> topCustomersByDebt(Long tenantId) {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery(
            "select c.id, c.name, " +
            "coalesce(sum(case when d.direction='INCREASE' then d.remaining_amount else -d.amount end),0) as debt_balance " +
            "from customers c " +
            "join customer_debt_transactions d on d.customer_id = c.id and d.tenant_id = :tenantId " +
            "where c.tenant_id = :tenantId and c.deleted_at is null " +
            "group by c.id, c.name " +
            "having coalesce(sum(case when d.direction='INCREASE' then d.remaining_amount else -d.amount end),0) > 0 " +
            "order by debt_balance desc " +
            "limit 5"
        )
            .setParameter("tenantId", tenantId)
            .getResultList();

        return rows.stream()
            .map(row -> new DebtLeader(
                ((Number) row[0]).longValue(),
                (String) row[1],
                (BigDecimal) row[2]
            ))
            .toList();
    }

    private List<TopSellingProduct> topSellingProducts(Long tenantId) {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery(
            "select p.id, p.name, coalesce(sum(i.quantity),0) as total_quantity, coalesce(sum(i.line_total),0) as revenue " +
            "from sales_order_items i " +
            "join sales_orders o on o.id = i.sales_order_id " +
            "join products p on p.id = i.product_id " +
            "where o.tenant_id = :tenantId and p.tenant_id = :tenantId and p.deleted_at is null " +
            "and o.status in ('COMPLETED','CONFIRMED') " +
            "group by p.id, p.name " +
            "order by total_quantity desc " +
            "limit 5"
        )
            .setParameter("tenantId", tenantId)
            .getResultList();

        return rows.stream()
            .map(row -> new TopSellingProduct(
                ((Number) row[0]).longValue(),
                (String) row[1],
                ((Number) row[2]).longValue(),
                (BigDecimal) row[3]
            ))
            .toList();
    }
}
