package com.example.dms.notification;

import com.example.dms.common.TenantContext;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationQueryService {

    private final NotificationRepository notificationRepository;

    public List<Notification> listRecent() {
        return notificationRepository.findByTenantIdOrderByCreatedAtDesc(
            TenantContext.tenantRequired()
        );
    }
}
