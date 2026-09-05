package com.example.dms.product;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {

    Page<Product> findByTenantIdAndDeletedAtIsNullAndNameContainingIgnoreCase(
        Long tenantId,
        String keyword,
        Pageable pageable
    );

    Optional<Product> findByIdAndTenantIdAndDeletedAtIsNull(Long id, Long tenantId);

    boolean existsByIdAndTenantIdAndDeletedAtIsNull(Long id, Long tenantId);

    List<Product> findByTenantIdAndIdInAndDeletedAtIsNull(
        Long tenantId,
        Collection<Long> ids
    );

    List<Product> findByTenantIdAndIdIn(
        Long tenantId,
        Collection<Long> ids
    );

    Optional<Product> findFirstByTenantIdAndDeletedAtIsNullAndSkuIgnoreCase(Long tenantId, String sku);

    long countByTenantIdAndDeletedAtIsNull(Long tenantId);
}
