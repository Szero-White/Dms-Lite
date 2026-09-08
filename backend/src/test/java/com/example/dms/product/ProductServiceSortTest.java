package com.example.dms.product;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.dms.audit.AuditService;
import com.example.dms.common.TenantContext;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

@ExtendWith(MockitoExtension.class)
class ProductServiceSortTest {

    @Mock private ProductRepository productRepository;
    @Mock private AuditService auditService;

    private ProductService productService;

    @BeforeEach
    void setUp() {
        productService = new ProductService(productRepository, auditService);
        TenantContext.set(1L, 10L);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void listsNewestProductsFirstByDefault() {
        when(productRepository.findByTenantIdAndDeletedAtIsNullAndNameContainingIgnoreCase(
            eq(1L),
            eq(""),
            any(Pageable.class)
        )).thenReturn(new PageImpl<>(List.<Product>of()));

        productService.list("", 0, 20);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(productRepository).findByTenantIdAndDeletedAtIsNullAndNameContainingIgnoreCase(
            eq(1L),
            eq(""),
            pageableCaptor.capture()
        );

        Sort.Order idOrder = pageableCaptor.getValue().getSort().getOrderFor("id");
        assertThat(idOrder).isNotNull();
        assertThat(idOrder.getDirection()).isEqualTo(Sort.Direction.DESC);
    }
}
