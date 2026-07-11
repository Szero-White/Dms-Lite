package com.example.dms.product;

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
}
