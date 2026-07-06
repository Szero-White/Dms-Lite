package com.example.dms.inventory;
import org.springframework.data.jpa.repository.*;import org.springframework.data.repository.query.Param;import jakarta.persistence.LockModeType;import java.util.*;
public interface StockItemRepository extends JpaRepository<StockItem,Long>{
 Optional<StockItem> findByTenantIdAndWarehouseIdAndProductId(Long t,Long w,Long p);
 @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select s from StockItem s where s.tenantId=:t and s.warehouseId=:w and s.productId=:p") Optional<StockItem> lock(@Param("t")Long t,@Param("w")Long w,@Param("p")Long p);
 List<StockItem> findByTenantId(Long t);
 @Query("select s from StockItem s join Product p on p.id=s.productId where s.tenantId=:t and s.quantityOnHand<=p.minStock") List<StockItem> lowStock(@Param("t")Long t);
}
