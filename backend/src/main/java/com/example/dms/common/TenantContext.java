package com.example.dms.common;

public final class TenantContext {

    private static final ThreadLocal<Long> TENANT = new ThreadLocal<>();

    private static final ThreadLocal<Long> USER = new ThreadLocal<>();

    private TenantContext() {
    }

    public static void set(Long tenantId, Long userId) {
        TENANT.set(tenantId);
        USER.set(userId);
    }

    public static Long tenant() {
        return TENANT.get();
    }

    public static Long user() {
        return USER.get();
    }

    public static void clear() {
        TENANT.remove();
        USER.remove();
    }

    public static Long tenantRequired() {
        Long tenantId = TENANT.get();
        if (tenantId == null) {
            throw new IllegalStateException("Missing tenant");
        }

        return tenantId;
    }

    public static Long userOrZero() {
        return USER.get() == null ? 0L : USER.get();
    }
}
