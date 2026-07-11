package com.example.dms.inventory;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StockItemRepository extends JpaRepository<StockItem, Long> {

    Optional<StockItem> findByTenantIdAndWarehouseIdAndProductId(
        Long tenantId,
        Long warehouseId,
        Long productId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query(
        "select s from StockItem s " +
        "where s.tenantId = :tenantId and s.warehouseId = :warehouseId and s.productId = :productId"
    )
    Optional<StockItem> lock(
        @Param("tenantId") Long tenantId,
        @Param("warehouseId") Long warehouseId,
        @Param("productId") Long productId
    );

    List<StockItem> findByTenantId(Long tenantId);

    @Query(
        "select s from StockItem s " +
        "join Product p on p.id = s.productId " +
        "where s.tenantId = :tenantId and s.quantityOnHand <= p.minStock"
    )
    List<StockItem> lowStock(@Param("tenantId") Long tenantId);
}
