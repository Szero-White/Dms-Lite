package com.example.dms.inventory;
import org.springframework.data.jpa.repository.JpaRepository;import java.util.*;
public interface WarehouseRepository extends JpaRepository<Warehouse,Long>{List<Warehouse> findByTenantId(Long tenantId);}
