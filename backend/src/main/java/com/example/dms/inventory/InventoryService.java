package com.example.dms.inventory;

import com.example.dms.common.BusinessException;
import com.example.dms.common.TenantContext;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final StockItemRepository stockItemRepository;

    private final InventoryTransactionRepository inventoryTransactionRepository;

    @Transactional
    @CacheEvict(value = "dashboard", allEntries = true)
    public void increase(
        Long tenantId,
        Long warehouseId,
        Long productId,
        int quantity,
        String sourceType,
        Long sourceId,
        String note
    ) {
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
    @CacheEvict(value = "dashboard", allEntries = true)
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
            .orElseThrow(() -> new BusinessException("Stock not found"));

        int beforeQuantity = stockItem.getQuantityOnHand();
        if (beforeQuantity < quantity) {
            throw new BusinessException("Insufficient stock for product " + productId);
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

    public List<InventoryTransaction> history() {
        return inventoryTransactionRepository.findByTenantIdOrderByCreatedAtDesc(
            TenantContext.tenantRequired()
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
