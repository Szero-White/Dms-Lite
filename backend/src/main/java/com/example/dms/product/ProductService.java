package com.example.dms.product;

import com.example.dms.audit.AuditService;
import com.example.dms.common.BusinessException;
import com.example.dms.common.code.BusinessCodeService;
import com.example.dms.common.code.BusinessCodeType;
import com.example.dms.common.PageRequestPolicy;
import com.example.dms.common.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final AuditService auditService;
    private final BusinessCodeService businessCodeService;

    @Transactional(readOnly = true)
    public Page<ProductResponse> list(String keyword, int page, int size) {
        boolean includeCost = canViewCost();

        return productRepository.findByTenantIdAndDeletedAtIsNullAndNameContainingIgnoreCase(
            TenantContext.tenantRequired(),
            keyword,
            PageRequestPolicy.newestById(page, size)
        ).map(product -> toResponse(product, includeCost));
    }

    @Transactional
    @CacheEvict(value = "dashboard", key = "T(com.example.dms.common.TenantContext).tenantRequired()")
    public ProductResponse create(ProductRequest request) {
        Long tenantId = TenantContext.tenantRequired();
        String sku = businessCodeService.next(BusinessCodeType.PRODUCT, tenantId);

        Product savedProduct = productRepository.save(
            Product.builder()
                .tenantId(tenantId)
                .name(request.name().trim())
                .sku(sku)
                .barcode(normalizeOptional(request.barcode()))
                .costPrice(request.costPrice())
                .sellingPrice(request.sellingPrice())
                .minStock(request.minStock())
                .active(true)
                .build()
        );

        auditService.log("PRODUCT_CREATED", "Product", savedProduct.getId(), savedProduct.getName());
        return toResponse(savedProduct, true);
    }

    @Transactional
    @CacheEvict(value = "dashboard", key = "T(com.example.dms.common.TenantContext).tenantRequired()")
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = find(id);
        product.setName(request.name().trim());
        product.setBarcode(normalizeOptional(request.barcode()));
        product.setCostPrice(request.costPrice());
        product.setSellingPrice(request.sellingPrice());
        product.setMinStock(request.minStock());

        Product updatedProduct = productRepository.save(product);
        auditService.log("PRODUCT_UPDATED", "Product", updatedProduct.getId(), updatedProduct.getName());
        return toResponse(updatedProduct, true);
    }

    @Transactional
    @CacheEvict(value = "dashboard", key = "T(com.example.dms.common.TenantContext).tenantRequired()")
    public ProductResponse deactivate(Long id) {
        Product product = lock(id);
        if (product.isActive()) {
            product.setActive(false);
            auditService.log("PRODUCT_DEACTIVATED", "Product", product.getId(), product.getName());
        }
        return toResponse(product, true);
    }

    @Transactional
    @CacheEvict(value = "dashboard", key = "T(com.example.dms.common.TenantContext).tenantRequired()")
    public ProductResponse reactivate(Long id) {
        Product product = lock(id);
        if (!product.isActive()) {
            product.setActive(true);
            auditService.log("PRODUCT_REACTIVATED", "Product", product.getId(), product.getName());
        }
        return toResponse(product, true);
    }

    @Transactional(readOnly = true)
    public Product find(Long id) {
        return productRepository.findByIdAndTenantIdAndDeletedAtIsNull(
            id,
            TenantContext.tenantRequired()
        ).orElseThrow(() -> new BusinessException("Product not found"));
    }

    private Product lock(Long id) {
        return productRepository.lockByIdAndTenantIdAndDeletedAtIsNull(
            id,
            TenantContext.tenantRequired()
        ).orElseThrow(() -> new BusinessException("Product not found"));
    }

    private boolean canViewCost() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        return authentication != null && ProductAccessPolicy.canViewCost(
            authentication.getAuthorities().stream().map(authority -> authority.getAuthority()).toList()
        );
    }

    private ProductResponse toResponse(Product product, boolean includeCost) {
        return new ProductResponse(
            product.getId(),
            product.getName(),
            product.getSku(),
            product.getBarcode(),
            includeCost ? product.getCostPrice() : null,
            product.getSellingPrice(),
            product.getMinStock(),
            product.isActive()
        );
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
