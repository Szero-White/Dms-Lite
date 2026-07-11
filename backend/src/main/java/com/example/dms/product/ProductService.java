package com.example.dms.product;

import com.example.dms.audit.AuditService;
import com.example.dms.common.BusinessException;
import com.example.dms.common.TenantContext;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    private final AuditService auditService;

    public Page<Product> list(String keyword, int page) {
        return productRepository.findByTenantIdAndDeletedAtIsNullAndNameContainingIgnoreCase(
            TenantContext.tenantRequired(),
            keyword,
            PageRequest.of(page, 20)
        );
    }

    @Transactional
    public Product create(ProductRequest request) {
        Product savedProduct = productRepository.save(
            Product.builder()
                .tenantId(TenantContext.tenantRequired())
                .name(request.name())
                .sku(request.sku())
                .barcode(request.barcode())
                .costPrice(request.costPrice())
                .sellingPrice(request.sellingPrice())
                .minStock(request.minStock())
                .active(true)
                .build()
        );

        auditService.log("PRODUCT_CREATED", "Product", savedProduct.getId(), savedProduct.getName());
        return savedProduct;
    }

    @Transactional
    public Product update(Long id, ProductRequest request) {
        Product product = find(id);
        product.setName(request.name());
        product.setSku(request.sku());
        product.setBarcode(request.barcode());
        product.setCostPrice(request.costPrice());
        product.setSellingPrice(request.sellingPrice());
        product.setMinStock(request.minStock());

        Product updatedProduct = productRepository.save(product);
        auditService.log("PRODUCT_UPDATED", "Product", updatedProduct.getId(), updatedProduct.getName());
        return updatedProduct;
    }

    @Transactional
    public void delete(Long id) {
        Product product = find(id);
        product.setDeletedAt(Instant.now());
        productRepository.save(product);
        auditService.log("PRODUCT_DELETED", "Product", id, product.getName());
    }

    public Product find(Long id) {
        return productRepository.findByIdAndTenantIdAndDeletedAtIsNull(
            id,
            TenantContext.tenantRequired()
        ).orElseThrow(() -> new BusinessException("Product not found"));
    }
}
