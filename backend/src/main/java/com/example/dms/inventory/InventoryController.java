package com.example.dms.inventory;
import com.example.dms.common.*;import lombok.*;import org.springframework.security.access.prepost.PreAuthorize;import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/inventory") @RequiredArgsConstructor
public class InventoryController {
 private final InventoryService service;
 @GetMapping("/stock") @PreAuthorize("hasAuthority('INVENTORY_VIEW')") ApiResponse<?> stock(){return ApiResponse.ok(service.stock());}
 @GetMapping("/transactions") @PreAuthorize("hasAuthority('INVENTORY_VIEW')") ApiResponse<?> history(){return ApiResponse.ok(service.history());}
}
