package com.example.dms.audit;
import com.example.dms.common.*;import lombok.*;import org.springframework.data.domain.*;import org.springframework.security.access.prepost.PreAuthorize;import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/audit-logs") @RequiredArgsConstructor
public class AuditController { private final AuditLogRepository repo; @GetMapping @PreAuthorize("hasAuthority('REPORT_VIEW')") ApiResponse<?> list(){return ApiResponse.ok(repo.findByTenantIdOrderByCreatedAtDesc(TenantContext.tenantRequired(),PageRequest.of(0,50)));} }
