package com.example.dms.help;

import com.example.dms.common.BusinessException;
import com.example.dms.common.TenantContext;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class HelpRateLimiter {

    private static final int MAX_REQUESTS = 12;

    private static final Duration WINDOW = Duration.ofMinutes(1);

    private final Map<String, RequestWindow> windows = new ConcurrentHashMap<>();

    public void checkAllowed() {
        String key = TenantContext.tenantRequired() + ":" + TenantContext.userOrZero();
        Instant now = Instant.now();

        windows.compute(key, (ignored, currentWindow) -> {
            if (currentWindow == null || currentWindow.expiresAt().isBefore(now)) {
                return new RequestWindow(1, now.plus(WINDOW));
            }

            if (currentWindow.count() >= MAX_REQUESTS) {
                throw new BusinessException("Too many AI questions. Please wait a moment before asking again.");
            }

            return new RequestWindow(currentWindow.count() + 1, currentWindow.expiresAt());
        });
    }

    private record RequestWindow(int count, Instant expiresAt) {
    }
}
