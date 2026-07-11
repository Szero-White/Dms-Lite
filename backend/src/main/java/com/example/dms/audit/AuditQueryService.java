package com.example.dms.audit;

import com.example.dms.common.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditQueryService {

    private final AuditLogRepository auditLogRepository;

    public Page<AuditLog> listRecent() {
        return auditLogRepository.findByTenantIdOrderByCreatedAtDesc(
            TenantContext.tenantRequired(),
            PageRequest.of(0, 50)
        );
    }
}
