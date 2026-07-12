package com.example.dms.inventory;

import com.example.dms.common.ApiResponse;
import com.example.dms.common.TenantContext;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/stock")
    @PreAuthorize("hasAuthority('INVENTORY_VIEW')")
    public ApiResponse<List<StockItem>> stock() {
        return ApiResponse.ok(inventoryService.stock());
    }

    @GetMapping("/transactions")
    @PreAuthorize("hasAuthority('INVENTORY_VIEW')")
    public ApiResponse<List<InventoryTransaction>> history() {
        return ApiResponse.ok(inventoryService.history());
    }

    @PostMapping("/receive")
    @PreAuthorize("hasAuthority('INVENTORY_VIEW')")
    public ApiResponse<Void> receive(
        @Valid @RequestBody StockReceiveRequest request
    ) {
        inventoryService.increase(
            TenantContext.tenantRequired(),
            request.warehouseId(),
            request.productId(),
            request.quantity(),
            "MANUAL_RECEIPT",
            null,
            request.note()
        );

        return ApiResponse.ok(null);
    }
}