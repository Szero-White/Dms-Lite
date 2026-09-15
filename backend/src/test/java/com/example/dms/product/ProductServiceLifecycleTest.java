package com.example.dms.product;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.dms.audit.AuditService;
import com.example.dms.common.TenantContext;
import com.example.dms.common.code.BusinessCodeService;
import com.example.dms.common.code.BusinessCodeType;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ProductServiceLifecycleTest {

    @Mock private ProductRepository productRepository;
    @Mock private AuditService auditService;
    @Mock private BusinessCodeService businessCodeService;

    private ProductService productService;

    @BeforeEach
    void setUp() {
        productService = new ProductService(productRepository, auditService, businessCodeService);
        TenantContext.set(1L, 10L);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }


    @Test
    void createAssignsSystemManagedProductCode() {
        when(businessCodeService.next(BusinessCodeType.PRODUCT, 1L)).thenReturn("PRD-000003");
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> {
            Product product = invocation.getArgument(0);
            product.setId(9L);
            return product;
        });

        ProductResponse response = productService.create(new ProductRequest(
            "Coffee",
            "CLIENT-SHOULD-NOT-CONTROL-CODE",
            null,
            new BigDecimal("23000"),
            new BigDecimal("30000"),
            5
        ));

        assertThat(response.sku()).isEqualTo("PRD-000003");
        verify(auditService).log("PRODUCT_CREATED", "Product", 9L, "Coffee");
    }

    @Test
    void updateKeepsExistingSystemManagedProductCode() {
        Product product = product(7L, true);
        product.setSku("PRD-000007");
        when(productRepository.findByIdAndTenantIdAndDeletedAtIsNull(7L, 1L))
            .thenReturn(Optional.of(product));
        when(productRepository.save(product)).thenReturn(product);

        ProductResponse response = productService.update(7L, new ProductRequest(
            "Milk updated",
            "CLIENT-CANNOT-CHANGE-CODE",
            "8930000000000",
            new BigDecimal("29000"),
            new BigDecimal("36000"),
            12
        ));

        assertThat(response.sku()).isEqualTo("PRD-000007");
        assertThat(product.getSku()).isEqualTo("PRD-000007");
        assertThat(product.getName()).isEqualTo("Milk updated");
    }

    @Test
    void deactivatesActiveProductWithoutDeletingHistory() {
        Product product = product(7L, true);
        when(productRepository.lockByIdAndTenantIdAndDeletedAtIsNull(7L, 1L))
            .thenReturn(Optional.of(product));

        ProductResponse response = productService.deactivate(7L);

        assertThat(product.isActive()).isFalse();
        assertThat(response.active()).isFalse();
        assertThat(product.getDeletedAt()).isNull();
        verify(auditService).log("PRODUCT_DEACTIVATED", "Product", 7L, "Milk");
    }

    @Test
    void deactivateIsIdempotentWhenProductIsAlreadyInactive() {
        Product product = product(7L, false);
        when(productRepository.lockByIdAndTenantIdAndDeletedAtIsNull(7L, 1L))
            .thenReturn(Optional.of(product));

        ProductResponse response = productService.deactivate(7L);

        assertThat(response.active()).isFalse();
        verify(auditService, never()).log("PRODUCT_DEACTIVATED", "Product", 7L, "Milk");
    }

    @Test
    void reactivatesInactiveProduct() {
        Product product = product(7L, false);
        when(productRepository.lockByIdAndTenantIdAndDeletedAtIsNull(7L, 1L))
            .thenReturn(Optional.of(product));

        ProductResponse response = productService.reactivate(7L);

        assertThat(product.isActive()).isTrue();
        assertThat(response.active()).isTrue();
        verify(auditService).log("PRODUCT_REACTIVATED", "Product", 7L, "Milk");
    }

    private Product product(Long id, boolean active) {
        return Product.builder()
            .id(id)
            .tenantId(1L)
            .name("Milk")
            .sku("MILK-01")
            .costPrice(new BigDecimal("28000"))
            .sellingPrice(new BigDecimal("35000"))
            .minStock(20)
            .active(active)
            .build();
    }
}
