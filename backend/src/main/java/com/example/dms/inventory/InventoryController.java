package com.example.dms.inventory;

import com.example.dms.common.ApiResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
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
}
