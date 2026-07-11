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
    public ApiResponse<Page<Product>> list(
        @RequestParam(defaultValue = "") String keyword,
        @RequestParam(defaultValue = "0") int page
    ) {
        return ApiResponse.ok(productService.list(keyword, page));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PRODUCT_MANAGE')")
    public ApiResponse<Product> create(@Valid @RequestBody ProductRequest request) {
        return ApiResponse.ok(productService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PRODUCT_MANAGE')")
    public ApiResponse<Product> update(
        @PathVariable Long id,
        @Valid @RequestBody ProductRequest request
    ) {
        return ApiResponse.ok(productService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PRODUCT_MANAGE')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        productService.delete(id);
        return ApiResponse.ok("deleted", null);
    }
}
