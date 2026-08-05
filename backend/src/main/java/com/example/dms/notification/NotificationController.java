package com.example.dms.notification;

import com.example.dms.common.ApiResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private static final int MAX_FEED_SIZE = 50;

    private final NotificationQueryService notificationQueryService;

    @GetMapping
    @PreAuthorize("hasAuthority('NOTIFICATION_VIEW')")
    public ApiResponse<List<NotificationFeedItem>> list(
        @RequestParam(defaultValue = "20") int size,
        Authentication authentication
    ) {
        int boundedSize = Math.min(Math.max(size, 1), MAX_FEED_SIZE);

        return ApiResponse.ok(notificationQueryService.listRecent(boundedSize, authentication));
    }

    @PutMapping("/{id}/read")
    @PreAuthorize("hasAuthority('NOTIFICATION_VIEW')")
    public ApiResponse<Void> markRead(@PathVariable Long id) {
        notificationQueryService.markRead(id);

        return ApiResponse.ok(null);
    }
}
