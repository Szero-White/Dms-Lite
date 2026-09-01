package com.example.dms.inventory;

import com.example.dms.common.BusinessException;
import com.example.dms.common.TenantContext;
import com.example.dms.product.ProductRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final StockItemRepository stockItemRepository;

    private final InventoryTransactionRepository inventoryTransactionRepository;

    private final WarehouseRepository warehouseRepository;

    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public WarehouseResponse defaultWarehouse() {
        return warehouseRepository.findFirstByTenantIdOrderByIdAsc(TenantContext.tenantRequired())
            .map(WarehouseResponse::from)
            .orElseThrow(() -> new BusinessException("Warehouse is not configured"));
    }

    @Transactional(readOnly = true)
    public void validateWarehouse(Long tenantId, Long warehouseId) {
        if (!warehouseRepository.existsByIdAndTenantId(warehouseId, tenantId)) {
            throw new BusinessException("Warehouse not found");
        }
    }

    @Transactional
    @CacheEvict(value = "dashboard", key = "#tenantId")
    public void increase(
        Long tenantId,
        Long warehouseId,
        Long productId,
        int quantity,
        String sourceType,
        Long sourceId,
        String note
    ) {
        validateWarehouse(tenantId, warehouseId);
        if (!productRepository.existsByIdAndTenantIdAndDeletedAtIsNull(productId, tenantId)) {
            throw new BusinessException("Product not found");
        }

        StockItem stockItem = stockItemRepository.lock(tenantId, warehouseId, productId)
            .orElseGet(() -> stockItemRepository.save(
                StockItem.builder()
                    .tenantId(tenantId)
                    .warehouseId(warehouseId)
                    .productId(productId)
                    .quantityOnHand(0)
                    .build()
            ));

        int beforeQuantity = stockItem.getQuantityOnHand();
        stockItem.setQuantityOnHand(beforeQuantity + quantity);

        saveTransaction(
            tenantId,
            warehouseId,
            productId,
            sourceType,
            sourceId,
            "IN",
            quantity,
            beforeQuantity,
            beforeQuantity + quantity,
            note
        );
    }

    @Transactional
    @CacheEvict(value = "dashboard", key = "#tenantId")
    public void deduct(
        Long tenantId,
        Long warehouseId,
        Long productId,
        int quantity,
        String sourceType,
        Long sourceId,
        String note
    ) {
        StockItem stockItem = stockItemRepository.lock(tenantId, warehouseId, productId)
            .orElseThrow(() -> new BusinessException(
                "Product " + productId +
                " has not been stocked in warehouse " + warehouseId
            ));

        int beforeQuantity = stockItem.getQuantityOnHand();
        if (beforeQuantity < quantity) {
            throw new BusinessException(
                "Insufficient stock for product " + productId +
                ". Available: " + beforeQuantity +
                ", required: " + quantity
            );
        }

        stockItem.setQuantityOnHand(beforeQuantity - quantity);

        saveTransaction(
            tenantId,
            warehouseId,
            productId,
            sourceType,
            sourceId,
            "OUT",
            quantity,
            beforeQuantity,
            beforeQuantity - quantity,
            note
        );
    }

    public List<StockItem> stock() {
        return stockItemRepository.findByTenantId(TenantContext.tenantRequired());
    }

    public Page<InventoryTransaction> history(Pageable pageable) {
        return inventoryTransactionRepository.findByTenantIdOrderByCreatedAtDesc(
            TenantContext.tenantRequired(),
            pageable
        );
    }

    private void saveTransaction(
        Long tenantId,
        Long warehouseId,
        Long productId,
        String sourceType,
        Long sourceId,
        String direction,
        int quantity,
        int beforeQuantity,
        int afterQuantity,
        String note
    ) {
        inventoryTransactionRepository.save(
            InventoryTransaction.builder()
                .tenantId(tenantId)
                .warehouseId(warehouseId)
                .productId(productId)
                .sourceType(sourceType)
                .sourceId(sourceId)
                .direction(direction)
                .quantity(quantity)
                .beforeQuantity(beforeQuantity)
                .afterQuantity(afterQuantity)
                .note(note)
                .createdBy(TenantContext.userOrZero())
                .build()
        );
    }
}
