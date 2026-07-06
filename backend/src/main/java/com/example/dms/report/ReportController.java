package com.example.dms.report;
import com.example.dms.common.*;import com.example.dms.debt.*;import com.example.dms.inventory.*;import com.example.dms.product.*;import com.example.dms.sales.*;import jakarta.persistence.*;import lombok.*;import org.springframework.cache.annotation.Cacheable;import org.springframework.security.access.prepost.PreAuthorize;import org.springframework.web.bind.annotation.*;import java.math.*;
@RestController @RequestMapping("/api/reports") @RequiredArgsConstructor
public class ReportController {
 private final EntityManager em; private final CustomerDebtRepository debts; private final ProductRepository products;
 public record Dashboard(BigDecimal revenueToday,BigDecimal revenueThisMonth,BigDecimal totalReceivable,long productCount){}
 @GetMapping("/dashboard") @PreAuthorize("hasAuthority('REPORT_VIEW')") @Cacheable(value="dashboard",key="T(com.example.dms.common.TenantContext).tenantRequired()")
 ApiResponse<Dashboard> dashboard(){Long t=TenantContext.tenantRequired();BigDecimal revenue=(BigDecimal)em.createNativeQuery("select coalesce(sum(total_amount),0) from sales_orders where tenant_id=:t and status='COMPLETED'").setParameter("t",t).getSingleResult();long count=products.findByTenantIdAndDeletedAtIsNullAndNameContainingIgnoreCase(t,"",org.springframework.data.domain.Pageable.unpaged()).getTotalElements();return ApiResponse.ok(new Dashboard(revenue,revenue,debts.totalReceivable(t),count));}
}
