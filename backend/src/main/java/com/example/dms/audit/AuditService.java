package com.example.dms.audit;

import com.example.dms.common.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public void log(String action, String entityType, Long entityId, String newValue) {
        auditLogRepository.save(
            AuditLog.builder()
                .tenantId(TenantContext.tenantRequired())
                .actorId(TenantContext.userOrZero())
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .newValue(newValue)
                .build()
        );
    }
}
