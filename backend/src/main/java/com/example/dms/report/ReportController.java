package com.example.dms.report;

import com.example.dms.common.ApiResponse;
import com.example.dms.common.TenantContext;
import com.example.dms.debt.CustomerDebtRepository;
import com.example.dms.product.ProductRepository;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final EntityManager entityManager;

    private final CustomerDebtRepository customerDebtRepository;

    private final ProductRepository productRepository;

    public record Dashboard(
        BigDecimal revenueToday,
        BigDecimal revenueThisMonth,
        BigDecimal totalReceivable,
        long productCount
    ) {
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasAuthority('REPORT_VIEW')")
    @Cacheable(value = "dashboard", key = "T(com.example.dms.common.TenantContext).tenantRequired()")
    public ApiResponse<Dashboard> dashboard() {
        Long tenantId = TenantContext.tenantRequired();
        BigDecimal revenue = (BigDecimal) entityManager.createNativeQuery(
            "select coalesce(sum(total_amount),0) from sales_orders where tenant_id=:tenantId and status='COMPLETED'"
        ).setParameter("tenantId", tenantId).getSingleResult();

        long productCount = productRepository
            .findByTenantIdAndDeletedAtIsNullAndNameContainingIgnoreCase(
                tenantId,
                "",
                Pageable.unpaged()
            )
            .getTotalElements();

        return ApiResponse.ok(
            new Dashboard(
                revenue,
                revenue,
                customerDebtRepository.totalReceivable(tenantId),
                productCount
            )
        );
    }
}
