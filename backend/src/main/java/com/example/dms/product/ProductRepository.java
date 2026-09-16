package com.example.dms.product;

import jakarta.persistence.LockModeType;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Long> {

    Page<Product> findByTenantIdAndDeletedAtIsNullAndNameContainingIgnoreCase(
        Long tenantId,
        String keyword,
        Pageable pageable
    );

    Optional<Product> findByIdAndTenantIdAndDeletedAtIsNull(Long id, Long tenantId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query(
        "select product from Product product "
            + "where product.id = :id and product.tenantId = :tenantId and product.deletedAt is null"
    )
    Optional<Product> lockByIdAndTenantIdAndDeletedAtIsNull(
        @Param("id") Long id,
        @Param("tenantId") Long tenantId
    );

    boolean existsByIdAndTenantIdAndDeletedAtIsNullAndActiveTrue(Long id, Long tenantId);

    List<Product> findByTenantIdAndIdInAndDeletedAtIsNullAndActiveTrue(
        Long tenantId,
        Collection<Long> ids
    );

    List<Product> findByTenantIdAndIdIn(
        Long tenantId,
        Collection<Long> ids
    );

    Optional<Product> findFirstByTenantIdAndDeletedAtIsNullAndSkuIgnoreCase(Long tenantId, String sku);

    long countByTenantIdAndDeletedAtIsNull(Long tenantId);

    long countByTenantIdAndDeletedAtIsNullAndActiveTrue(Long tenantId);
}
