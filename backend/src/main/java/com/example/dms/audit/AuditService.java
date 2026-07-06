package com.example.dms.audit;
import com.example.dms.common.*;import lombok.*;import org.springframework.stereotype.Service;
@Service @RequiredArgsConstructor
public class AuditService { private final AuditLogRepository repo; public void log(String action,String entity,Long id,String value){repo.save(AuditLog.builder().tenantId(TenantContext.tenantRequired()).actorId(TenantContext.userOrZero()).action(action).entityType(entity).entityId(id).newValue(value).build());} }
