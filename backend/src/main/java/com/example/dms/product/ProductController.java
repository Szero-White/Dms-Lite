package com.example.dms.product;

import com.example.dms.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    @PreAuthorize("hasAuthority('PRODUCT_VIEW')")
    public ApiResponse<Page<ProductResponse>> list(
        @RequestParam(defaultValue = "") String keyword,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.ok(productService.list(keyword, page, size));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PRODUCT_MANAGE')")
    public ApiResponse<ProductResponse> create(@Valid @RequestBody ProductRequest request) {
        return ApiResponse.ok(productService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PRODUCT_MANAGE')")
    public ApiResponse<ProductResponse> update(
        @PathVariable Long id,
        @Valid @RequestBody ProductRequest request
    ) {
        return ApiResponse.ok(productService.update(id, request));
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('PRODUCT_MANAGE')")
    public ApiResponse<ProductResponse> deactivate(@PathVariable Long id) {
        return ApiResponse.ok(productService.deactivate(id));
    }

    @PostMapping("/{id}/reactivate")
    @PreAuthorize("hasAuthority('PRODUCT_MANAGE')")
    public ApiResponse<ProductResponse> reactivate(@PathVariable Long id) {
        return ApiResponse.ok(productService.reactivate(id));
    }

    /**
     * Backward-compatible alias for older clients. Product master data is deactivated,
     * not removed from operational history.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PRODUCT_MANAGE')")
    public ApiResponse<ProductResponse> deleteCompatibilityAlias(@PathVariable Long id) {
        return ApiResponse.ok("deactivated", productService.deactivate(id));
    }
}
