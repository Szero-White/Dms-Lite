package com.example.dms.notification;
import com.example.dms.common.*;import lombok.*;import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/notifications") @RequiredArgsConstructor
public class NotificationController { private final NotificationRepository repo; @GetMapping ApiResponse<?> list(){return ApiResponse.ok(repo.findByTenantIdOrderByCreatedAtDesc(TenantContext.tenantRequired()));} }
