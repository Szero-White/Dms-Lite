package com.example.dms.report;

import com.example.dms.sales.SalesOrder;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class ReportReadRepository {

    private final EntityManager entityManager;

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
}
