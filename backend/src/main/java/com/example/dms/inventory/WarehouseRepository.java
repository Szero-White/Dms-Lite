package com.example.dms.inventory;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {

    List<Warehouse> findByTenantId(Long tenantId);
}
