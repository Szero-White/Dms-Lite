package com.example.dms.inventory;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {

    List<Warehouse> findByTenantId(Long tenantId);

    Optional<Warehouse> findFirstByTenantIdOrderByIdAsc(Long tenantId);

    List<Warehouse> findByTenantIdAndIdIn(Long tenantId, Collection<Long> ids);

    Optional<Warehouse> findByIdAndTenantId(Long id, Long tenantId);

    boolean existsByIdAndTenantId(Long id, Long tenantId);
}
