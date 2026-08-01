package com.example.dms.audit;

import com.example.dms.common.TenantContext;
import com.example.dms.user.AppUser;
import com.example.dms.user.AppUserRepository;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditQueryService {

    private final AuditLogRepository auditLogRepository;
    private final AppUserRepository userRepository;

    public Page<AuditLogResponse> listRecent() {
        Long tenantId = TenantContext.tenantRequired();
        Page<AuditLog> logs = auditLogRepository.findByTenantIdOrderByCreatedAtDesc(
            tenantId,
            PageRequest.of(0, 50)
        );
        Map<Long, AppUser> actorsById = userRepository.findByTenantIdAndIdIn(
                tenantId,
                logs.stream()
                    .map(AuditLog::getActorId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet())
            )
            .stream()
            .collect(Collectors.toMap(AppUser::getId, Function.identity()));

        return logs.map((log) -> toResponse(log, actorsById.get(log.getActorId())));
    }

    private AuditLogResponse toResponse(AuditLog log, AppUser actor) {
        return new AuditLogResponse(
            log.getId(),
            log.getActorId(),
            resolveActorName(log.getActorId(), actor),
            log.getAction(),
            log.getEntityType(),
            log.getEntityId(),
            log.getNewValue(),
            log.getCreatedAt()
        );
    }

    private String resolveActorName(Long actorId, AppUser actor) {
        if (actorId == null || actorId == 0) {
            return "System";
        }
        if (actor == null) {
            return "User #" + actorId;
        }
        if (actor.getFullName() != null && !actor.getFullName().isBlank()) {
            return actor.getFullName();
        }
        return actor.getUsername();
    }
}
