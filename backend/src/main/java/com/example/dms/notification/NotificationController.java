package com.example.dms.notification;

import com.example.dms.common.ApiResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
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

    /**
     * Set the current user's read state explicitly. This endpoint is idempotent and is
     * the canonical API used by the web client for both read and unread actions.
     */
    @PutMapping("/{id}/read-state")
    @PreAuthorize("hasAuthority('NOTIFICATION_VIEW')")
    public ApiResponse<Void> setReadState(
        @PathVariable String id,
        @Valid @RequestBody NotificationReadStateRequest request,
        Authentication authentication
    ) {
        notificationQueryService.setReadState(id, request.read(), authentication);

        return ApiResponse.ok(null);
    }

    // Backward-compatible endpoints for older clients. New clients should use
    // /read-state so the desired state is explicit in one idempotent operation.
    @PutMapping("/{id}/read")
    @PreAuthorize("hasAuthority('NOTIFICATION_VIEW')")
    public ApiResponse<Void> markRead(@PathVariable String id, Authentication authentication) {
        notificationQueryService.setReadState(id, true, authentication);

        return ApiResponse.ok(null);
    }

    @DeleteMapping("/{id}/read")
    @PreAuthorize("hasAuthority('NOTIFICATION_VIEW')")
    public ApiResponse<Void> markUnread(@PathVariable String id, Authentication authentication) {
        notificationQueryService.setReadState(id, false, authentication);

        return ApiResponse.ok(null);
    }
}
