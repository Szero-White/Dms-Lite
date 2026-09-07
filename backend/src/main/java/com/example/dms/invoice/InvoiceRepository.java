package com.example.dms.invoice;

import com.example.dms.sales.SalesOrder;
import com.example.dms.sales.SalesOrderStatus;
import jakarta.persistence.LockModeType;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Locale;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InvoiceRepository
    extends JpaRepository<Invoice, Long>, JpaSpecificationExecutor<Invoice> {

    @EntityGraph(attributePaths = "items")
    Optional<Invoice> findDetailByIdAndTenantId(Long id, Long tenantId);

    Optional<Invoice> findByTenantIdAndSalesOrderId(Long tenantId, Long salesOrderId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select invoice from Invoice invoice where invoice.id = :id and invoice.tenantId = :tenantId")
    Optional<Invoice> lockByIdAndTenantId(@Param("id") Long id, @Param("tenantId") Long tenantId);

    default Page<Invoice> searchPaidInvoices(
        Long tenantId,
        String search,
        Instant fromInclusive,
        Instant toExclusive,
        Pageable pageable
    ) {
        Specification<Invoice> specification = paidInvoiceSpecification(tenantId);

        if (fromInclusive != null) {
            specification = specification.and(
                (root, query, builder) -> builder.greaterThanOrEqualTo(root.get("createdAt"), fromInclusive)
            );
        }

        if (toExclusive != null) {
            specification = specification.and(
                (root, query, builder) -> builder.lessThan(root.get("createdAt"), toExclusive)
            );
        }

        String normalizedSearch = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);
        if (!normalizedSearch.isEmpty()) {
            String pattern = "%" + normalizedSearch + "%";
            specification = specification.and((root, query, builder) -> {
                Subquery<Long> matchingOrder = query.subquery(Long.class);
                Root<SalesOrder> order = matchingOrder.from(SalesOrder.class);
                matchingOrder.select(order.get("id")).where(
                    builder.equal(order.get("id"), root.get("salesOrderId")),
                    builder.equal(order.get("tenantId"), tenantId),
                    builder.like(builder.lower(order.<String>get("code")), pattern)
                );

                return builder.or(
                    builder.like(builder.lower(root.<String>get("invoiceNumber")), pattern),
                    builder.like(
                        builder.lower(builder.coalesce(root.<String>get("customerName"), "")),
                        pattern
                    ),
                    builder.exists(matchingOrder)
                );
            });
        }

        Pageable sortedPageable = PageRequest.of(
            pageable.getPageNumber(),
            pageable.getPageSize(),
            Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))
        );

        return findAll(specification, sortedPageable);
    }

    private static Specification<Invoice> paidInvoiceSpecification(Long tenantId) {
        return (root, query, builder) -> {
            Subquery<Long> paidOrder = query.subquery(Long.class);
            Root<SalesOrder> order = paidOrder.from(SalesOrder.class);
            paidOrder.select(order.get("id")).where(
                builder.equal(order.get("id"), root.get("salesOrderId")),
                builder.equal(order.get("tenantId"), tenantId),
                builder.equal(order.get("status"), SalesOrderStatus.COMPLETED),
                builder.greaterThan(order.<BigDecimal>get("totalAmount"), BigDecimal.ZERO),
                builder.lessThanOrEqualTo(order.<BigDecimal>get("debtAmount"), BigDecimal.ZERO),
                builder.greaterThanOrEqualTo(
                    order.<BigDecimal>get("paidAmount"),
                    order.<BigDecimal>get("totalAmount")
                )
            );

            return builder.and(
                builder.equal(root.get("tenantId"), tenantId),
                builder.exists(paidOrder)
            );
        };
    }
}
