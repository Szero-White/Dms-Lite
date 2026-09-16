package com.example.dms.seed;

import java.util.Locale;
import java.util.Set;

/**
 * Centralizes demo-only access decisions so seed data and team management
 * do not drift when demo personas change.
 */
public final class DemoAccessPolicy {

    public static final String OWNER_USERNAME = "owner";
    public static final String SALES_USERNAME = "sale";
    public static final String ACCOUNTANT_USERNAME = "accountant";
    public static final String RETIRED_WAREHOUSE_USERNAME = "warehouse";
    public static final String RETIRED_WAREHOUSE_ROLE = "WAREHOUSE_STAFF";

    private static final Set<String> PROTECTED_USERNAMES = Set.of(
        OWNER_USERNAME,
        SALES_USERNAME,
        ACCOUNTANT_USERNAME,
        RETIRED_WAREHOUSE_USERNAME
    );

    private DemoAccessPolicy() {
    }

    public static boolean isProtectedUsername(String username) {
        return username != null && PROTECTED_USERNAMES.contains(normalize(username));
    }

    public static boolean isRetiredDemoUsername(String username) {
        return username != null && RETIRED_WAREHOUSE_USERNAME.equals(normalize(username));
    }

    public static boolean isHiddenDemoSystemRole(String roleName) {
        return roleName != null && RETIRED_WAREHOUSE_ROLE.equalsIgnoreCase(roleName.trim());
    }

    private static String normalize(String value) {
        return value.trim().toLowerCase(Locale.ROOT);
    }
}
