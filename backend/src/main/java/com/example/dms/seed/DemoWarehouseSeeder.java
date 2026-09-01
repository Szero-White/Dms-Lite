package com.example.dms.seed;

import com.example.dms.inventory.Warehouse;
import com.example.dms.inventory.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DemoWarehouseSeeder {

    private final WarehouseRepository warehouseRepository;

    public Long ensureWarehouse(Long tenantId) {
        return warehouseRepository.findFirstByTenantIdOrderByIdAsc(tenantId)
            .orElseGet(() -> warehouseRepository.save(
                Warehouse.builder()
                    .tenantId(tenantId)
                    .name("Kho chính")
                    .build()
            ))
            .getId();
    }
}
