package com.example.dms.inventory;

import com.example.dms.common.ApiResponse;
import com.example.dms.common.TenantContext;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {


    private static final int MAX_HISTORY_SIZE = 100;

    private final InventoryService inventoryService;

    @GetMapping("/stock")
    @PreAuthorize("hasAuthority('INVENTORY_VIEW')")
    public ApiResponse<List<StockItem>> stock() {
        return ApiResponse.ok(inventoryService.stock());
    }

    @GetMapping("/transactions")
    @PreAuthorize("hasAuthority('INVENTORY_VIEW')")
    public ApiResponse<Page<InventoryTransaction>> history(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "50") int size
    ) {
        int boundedSize = Math.min(Math.max(size, 1), MAX_HISTORY_SIZE);
        Pageable pageable = PageRequest.of(
            Math.max(page, 0),
            boundedSize,
            Sort.by(Sort.Direction.DESC, "createdAt")
        );

        return ApiResponse.ok(inventoryService.history(pageable));
    }

    @PostMapping("/receive")
    @PreAuthorize("hasAuthority('INVENTORY_MANAGE')")
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
