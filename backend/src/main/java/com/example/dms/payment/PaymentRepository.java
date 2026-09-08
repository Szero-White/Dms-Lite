package com.example.dms.payment;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface PaymentRepository
    extends JpaRepository<Payment, Long>, JpaSpecificationExecutor<Payment> {

    Optional<Payment> findByIdAndTenantId(Long id, Long tenantId);

    Optional<Payment> findByTenantIdAndRequestKey(Long tenantId, String requestKey);

    List<Payment> findByTenantIdAndIdIn(Long tenantId, Collection<Long> ids);

    Page<Payment> findByTenantIdOrderByCreatedAtDesc(Long tenantId, Pageable pageable);

    default Page<Payment> searchHistory(
        Long tenantId,
        String search,
        Instant fromInclusive,
        Instant toExclusive,
        Pageable pageable
    ) {
        Specification<Payment> specification =
            (root, query, builder) -> builder.equal(root.get("tenantId"), tenantId);

        if (fromInclusive != null) {
            specification = specification.and(
                (root, query, builder) -> builder.greaterThanOrEqualTo(
                    root.get("createdAt"),
                    fromInclusive
                )
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
            specification = specification.and((root, query, builder) -> builder.or(
                builder.like(builder.lower(root.<String>get("code")), pattern),
                builder.like(
                    builder.lower(builder.coalesce(root.<String>get("salesOrderCodeSnapshot"), "")),
                    pattern
                ),
                builder.like(
                    builder.lower(builder.coalesce(root.<String>get("customerNameSnapshot"), "")),
                    pattern
                ),
                builder.like(
                    builder.lower(builder.coalesce(root.<String>get("note"), "")),
                    pattern
                )
            ));
        }

        Sort requestedSort = pageable.getSort().isSorted()
            ? pageable.getSort()
            : Sort.by(Sort.Order.desc("createdAt"));
        Pageable sortedPageable = PageRequest.of(
            pageable.getPageNumber(),
            pageable.getPageSize(),
            requestedSort.and(Sort.by(Sort.Order.desc("id")))
        );

        return findAll(specification, sortedPageable);
    }
}
