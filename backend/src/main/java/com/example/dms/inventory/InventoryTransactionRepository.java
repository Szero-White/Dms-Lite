package com.example.dms.inventory;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {

    Page<InventoryTransaction> findByTenantIdOrderByCreatedAtDesc(Long tenantId, Pageable pageable);

    java.util.List<InventoryTransaction> findByTenantIdAndSourceTypeOrderByCreatedAtDesc(
        Long tenantId,
        String sourceType,
        Pageable pageable
    );

    Optional<InventoryTransaction> findFirstByTenantIdAndWarehouseIdAndProductIdOrderByCreatedAtDesc(
        Long tenantId,
        Long warehouseId,
        Long productId
    );
}
