package com.example.dms.report;

import com.example.dms.sales.SalesOrder;
import com.example.dms.sales.SalesOrderStatus;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class ReportReadRepository {

    private final EntityManager entityManager;

    public BigDecimal revenueSince(Long tenantId, Instant sinceInclusive) {
        return entityManager.createQuery(
            "select coalesce(sum(salesOrder.totalAmount),0) " +
            "from SalesOrder salesOrder " +
            "where salesOrder.tenantId=:tenantId " +
            "and salesOrder.status=:status " +
            "and salesOrder.confirmedAt>=:since",
            BigDecimal.class
        )
            .setParameter("tenantId", tenantId)
            .setParameter("status", SalesOrderStatus.COMPLETED)
            .setParameter("since", sinceInclusive)
            .getSingleResult();
    }

    public List<SalesReportReadRow> salesOrders(
        Long tenantId,
        Instant fromInclusive,
        Instant toInclusive
    ) {
        StringBuilder jpql = new StringBuilder(
            "select salesOrder, customer.name, coalesce(salesOrder.confirmedAt, salesOrder.createdAt) " +
            "from SalesOrder salesOrder, Customer customer " +
            "where salesOrder.tenantId=:tenantId " +
            "and customer.tenantId=:tenantId " +
            "and customer.id=salesOrder.customerId "
        );

        if (fromInclusive != null) {
            jpql.append("and coalesce(salesOrder.confirmedAt, salesOrder.createdAt)>=:fromInclusive ");
        }
        if (toInclusive != null) {
            jpql.append("and coalesce(salesOrder.confirmedAt, salesOrder.createdAt)<=:toInclusive ");
        }
        jpql.append("order by coalesce(salesOrder.confirmedAt, salesOrder.createdAt) desc, salesOrder.id desc");

        TypedQuery<Object[]> query = entityManager.createQuery(jpql.toString(), Object[].class)
            .setParameter("tenantId", tenantId);

        if (fromInclusive != null) {
            query.setParameter("fromInclusive", fromInclusive);
        }
        if (toInclusive != null) {
            query.setParameter("toInclusive", toInclusive);
        }

        return query.getResultList().stream()
            .map(row -> {
                SalesOrder salesOrder = (SalesOrder) row[0];
                return new SalesReportReadRow(
                    salesOrder.getId(),
                    salesOrder.getCode(),
                    salesOrder.getCustomerId(),
                    (String) row[1],
                    salesOrder.getStatus().name(),
                    salesOrder.getTotalAmount(),
                    (Instant) row[2],
                    salesOrder.getCreatedAt(),
                    salesOrder.getConfirmedAt()
                );
            })
            .toList();
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
