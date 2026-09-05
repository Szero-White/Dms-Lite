package com.example.dms.product;

import com.example.dms.user.PermissionNames;
import java.util.Collection;
import java.util.Set;

public final class ProductAccessPolicy {

    private static final Set<String> COST_PERMISSIONS = Set.of(
        PermissionNames.PRODUCT_MANAGE,
        PermissionNames.REPORT_VIEW
    );

    private ProductAccessPolicy() {
    }

    public static boolean canViewCost(Collection<String> authorities) {
        return authorities.stream().anyMatch(COST_PERMISSIONS::contains);
    }
}
