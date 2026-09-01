package com.example.dms.report;

import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class ReportReadRepository {

    private final EntityManager entityManager;

    public BigDecimal revenueSince(Long tenantId, LocalDate date) {
        return (BigDecimal) entityManager.createNativeQuery(
            "select coalesce(sum(total_amount),0) " +
            "from sales_orders " +
            "where tenant_id=:tenantId and status='COMPLETED' and confirmed_at >= :since"
        )
            .setParameter("tenantId", tenantId)
            .setParameter("since", date.atStartOfDay())
            .getSingleResult();
    }

    public long productCount(Long tenantId) {
        Number count = (Number) entityManager.createNativeQuery(
            "select count(*) from products where tenant_id=:tenantId and deleted_at is null"
        )
            .setParameter("tenantId", tenantId)
            .getSingleResult();

        return count.longValue();
    }

    public long lowStockCount(Long tenantId) {
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

    public List<DashboardReport.TopSellingProduct> topSellingProducts(Long tenantId) {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery(
            "select p.id, p.name, coalesce(sum(i.quantity),0) as total_quantity, " +
            "coalesce(sum(i.line_total),0) as revenue " +
            "from sales_order_items i " +
            "join sales_orders o on o.id = i.sales_order_id " +
            "join products p on p.id = i.product_id " +
            "where o.tenant_id = :tenantId and p.tenant_id = :tenantId and p.deleted_at is null " +
            "and o.status = 'COMPLETED' " +
            "group by p.id, p.name " +
            "order by total_quantity desc " +
            "limit 5"
        )
            .setParameter("tenantId", tenantId)
            .getResultList();

        return rows.stream()
            .map(row -> new DashboardReport.TopSellingProduct(
                ((Number) row[0]).longValue(),
                (String) row[1],
                ((Number) row[2]).longValue(),
                (BigDecimal) row[3]
            ))
            .toList();
    }
}
