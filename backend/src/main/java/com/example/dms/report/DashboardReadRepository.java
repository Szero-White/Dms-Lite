package com.example.dms.report;

import com.example.dms.sales.SalesOrderStatus;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.sql.Date;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class DashboardReadRepository {

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
            "from stock_items stock " +
            "join products product on product.id=stock.product_id " +
            "where stock.tenant_id=:tenantId and product.tenant_id=:tenantId " +
            "and product.deleted_at is null and stock.quantity_on_hand<=product.min_stock"
        )
            .setParameter("tenantId", tenantId)
            .getSingleResult();

        return count.longValue();
    }

    public ReceivableAttentionReport receivableAttention(
        Long tenantId,
        LocalDate today,
        LocalDate dueSoonThrough
    ) {
        Object[] summary = (Object[]) entityManager.createNativeQuery(
            "select " +
            "coalesce(sum(case when debt.due_date < :today then debt.remaining_amount else 0 end),0), " +
            "coalesce(sum(case when debt.due_date < :today then 1 else 0 end),0), " +
            "coalesce(sum(case when debt.due_date = :today then debt.remaining_amount else 0 end),0), " +
            "coalesce(sum(case when debt.due_date = :today then 1 else 0 end),0), " +
            "coalesce(sum(case when debt.due_date > :today and debt.due_date <= :dueSoonThrough " +
            "then debt.remaining_amount else 0 end),0), " +
            "coalesce(sum(case when debt.due_date > :today and debt.due_date <= :dueSoonThrough " +
            "then 1 else 0 end),0) " +
            "from customer_debt_transactions debt " +
            "join sales_orders sales_order on sales_order.id=debt.source_id " +
            "and sales_order.tenant_id=debt.tenant_id " +
            "join customers customer on customer.id=sales_order.customer_id " +
            "and customer.tenant_id=debt.tenant_id " +
            "where debt.tenant_id=:tenantId " +
            "and debt.source_type='SALES_ORDER' " +
            "and debt.direction='INCREASE' " +
            "and debt.remaining_amount>0 " +
            "and sales_order.status='COMPLETED' " +
            "and customer.deleted_at is null"
        )
            .setParameter("tenantId", tenantId)
            .setParameter("today", today)
            .setParameter("dueSoonThrough", dueSoonThrough)
            .getSingleResult();

        return new ReceivableAttentionReport(
            decimal(summary[0]),
            number(summary[1]),
            decimal(summary[2]),
            number(summary[3]),
            decimal(summary[4]),
            number(summary[5]),
            oldestOverdue(tenantId, today)
        );
    }

    public List<DashboardReport.TopSellingProduct> topSellingProducts(Long tenantId) {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery(
            "select product.id, product.name, coalesce(sum(item.quantity),0) as total_quantity, " +
            "coalesce(sum(item.line_total),0) as revenue " +
            "from sales_order_items item " +
            "join sales_orders sales_order on sales_order.id=item.sales_order_id " +
            "join products product on product.id=item.product_id " +
            "where sales_order.tenant_id=:tenantId and product.tenant_id=:tenantId " +
            "and product.deleted_at is null and sales_order.status='COMPLETED' " +
            "group by product.id, product.name " +
            "order by total_quantity desc limit 5"
        )
            .setParameter("tenantId", tenantId)
            .getResultList();

        return rows.stream()
            .map(row -> new DashboardReport.TopSellingProduct(
                ((Number) row[0]).longValue(),
                (String) row[1],
                ((Number) row[2]).longValue(),
                decimal(row[3])
            ))
            .toList();
    }

    private ReceivableAttentionReport.OverduePreview oldestOverdue(Long tenantId, LocalDate today) {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery(
            "select sales_order.id, sales_order.code, customer.id, customer.name, " +
            "debt.remaining_amount, debt.due_date " +
            "from customer_debt_transactions debt " +
            "join sales_orders sales_order on sales_order.id=debt.source_id " +
            "and sales_order.tenant_id=debt.tenant_id " +
            "join customers customer on customer.id=sales_order.customer_id " +
            "and customer.tenant_id=debt.tenant_id " +
            "where debt.tenant_id=:tenantId " +
            "and debt.source_type='SALES_ORDER' " +
            "and debt.direction='INCREASE' " +
            "and debt.remaining_amount>0 " +
            "and debt.due_date<:today " +
            "and sales_order.status='COMPLETED' " +
            "and customer.deleted_at is null " +
            "order by debt.due_date asc, sales_order.confirmed_at asc, sales_order.id asc " +
            "limit 1"
        )
            .setParameter("tenantId", tenantId)
            .setParameter("today", today)
            .getResultList();

        if (rows.isEmpty()) {
            return null;
        }

        Object[] row = rows.get(0);
        LocalDate dueDate = localDate(row[5]);
        return new ReceivableAttentionReport.OverduePreview(
            ((Number) row[0]).longValue(),
            (String) row[1],
            ((Number) row[2]).longValue(),
            (String) row[3],
            decimal(row[4]),
            dueDate,
            ChronoUnit.DAYS.between(dueDate, today)
        );
    }

    private BigDecimal decimal(Object value) {
        return value instanceof BigDecimal decimal ? decimal : new BigDecimal(value.toString());
    }

    private long number(Object value) {
        return value instanceof Number number ? number.longValue() : Long.parseLong(value.toString());
    }

    private LocalDate localDate(Object value) {
        if (value instanceof LocalDate localDate) {
            return localDate;
        }
        if (value instanceof Date date) {
            return date.toLocalDate();
        }
        return LocalDate.parse(value.toString());
    }
}
