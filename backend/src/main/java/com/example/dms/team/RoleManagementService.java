package com.example.dms.team;

import com.example.dms.audit.AuditService;
import com.example.dms.common.BusinessException;
import com.example.dms.common.TenantContext;
import com.example.dms.user.AppUserRepository;
import com.example.dms.user.Permission;
import com.example.dms.user.PermissionNames;
import com.example.dms.user.PermissionRepository;
import com.example.dms.user.Role;
import com.example.dms.user.RoleRepository;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RoleManagementService {

    private static final String OWNER_ROLE = "OWNER";

    private static final Set<String> SYSTEM_ROLE_NAMES = Set.of(
        OWNER_ROLE,
        "SALE_STAFF",
        "WAREHOUSE_STAFF",
        "ACCOUNTANT"
    );

    private static final Set<String> OWNER_ONLY_PERMISSIONS = Set.of(PermissionNames.TEAM_MANAGE);

    private static final Map<String, Set<String>> PERMISSION_DEPENDENCIES = Map.ofEntries(
        Map.entry(PermissionNames.PRODUCT_MANAGE, Set.of(PermissionNames.PRODUCT_VIEW)),
        Map.entry(PermissionNames.CUSTOMER_MANAGE, Set.of(PermissionNames.CUSTOMER_VIEW)),
        Map.entry(PermissionNames.CUSTOMER_DEACTIVATE, Set.of(PermissionNames.CUSTOMER_VIEW)),
        Map.entry(
            PermissionNames.SALES_ORDER_CREATE,
            Set.of(
                PermissionNames.CUSTOMER_VIEW,
                PermissionNames.PRODUCT_VIEW,
                PermissionNames.INVENTORY_VIEW
            )
        ),
        Map.entry(
            PermissionNames.SALES_ORDER_CONFIRM,
            Set.of(PermissionNames.SALES_ORDER_VIEW, PermissionNames.INVENTORY_VIEW)
        ),
        Map.entry(PermissionNames.SALES_ORDER_CANCEL, Set.of(PermissionNames.SALES_ORDER_VIEW)),
        Map.entry(
            PermissionNames.INVOICE_CREATE,
            Set.of(PermissionNames.INVOICE_VIEW, PermissionNames.SALES_ORDER_VIEW)
        ),
        Map.entry(PermissionNames.INVOICE_ISSUE, Set.of(PermissionNames.INVOICE_VIEW)),
        Map.entry(PermissionNames.INVOICE_CANCEL, Set.of(PermissionNames.INVOICE_VIEW)),
        Map.entry(PermissionNames.INVENTORY_VIEW, Set.of(PermissionNames.PRODUCT_VIEW)),
        Map.entry(
            PermissionNames.INVENTORY_MANAGE,
            Set.of(PermissionNames.INVENTORY_VIEW, PermissionNames.PRODUCT_VIEW)
        ),
        Map.entry(PermissionNames.PAYMENT_CREATE, Set.of(PermissionNames.CUSTOMER_VIEW)),
        Map.entry(PermissionNames.DEBT_VIEW, Set.of(PermissionNames.CUSTOMER_VIEW))
    );

    private static final Map<String, PermissionMetadata> PERMISSION_METADATA = Map.ofEntries(
        entry(PermissionNames.PRODUCT_VIEW, "View products", "Catalog", "See product catalog and pricing."),
        entry(PermissionNames.PRODUCT_MANAGE, "Manage products", "Catalog", "Create, update and deactivate products."),
        entry(PermissionNames.CUSTOMER_VIEW, "View customers", "Customers", "See customer profiles and limits."),
        entry(PermissionNames.CUSTOMER_MANAGE, "Manage customers", "Customers", "Create and update customer records."),
        entry(PermissionNames.CUSTOMER_DEACTIVATE, "Change customer status", "Customers", "Deactivate or reactivate customer accounts."),
        entry(PermissionNames.SALES_ORDER_VIEW, "View sales orders", "Sales", "See sales orders and statuses."),
        entry(PermissionNames.SALES_ORDER_CREATE, "Create sales orders", "Sales", "Create draft sales orders."),
        entry(PermissionNames.SALES_ORDER_CONFIRM, "Confirm sales orders", "Sales", "Confirm orders for fulfillment."),
        entry(PermissionNames.SALES_ORDER_CANCEL, "Cancel sales orders", "Sales", "Cancel incorrect or invalid orders."),
        entry(PermissionNames.INVOICE_VIEW, "View invoices", "Finance", "See invoices generated from completed sales orders."),
        entry(PermissionNames.INVOICE_CREATE, "Create invoices", "Finance", "Create an invoice from a completed sales order."),
        entry(PermissionNames.INVOICE_ISSUE, "Issue invoices", "Finance", "Issue prepared sales invoices."),
        entry(PermissionNames.INVOICE_CANCEL, "Cancel invoices", "Finance", "Cancel an unpaid invoice document."),
        entry(PermissionNames.INVENTORY_VIEW, "View inventory", "Inventory", "See stock by warehouse and product."),
        entry(PermissionNames.INVENTORY_MANAGE, "Manage inventory", "Inventory", "Receive or adjust stock levels."),
        entry(PermissionNames.PAYMENT_CREATE, "Record payments", "Finance", "Record customer payments."),
        entry(PermissionNames.DEBT_VIEW, "View debt", "Finance", "See customer receivables."),
        entry(PermissionNames.REPORT_VIEW, "View reports", "Insights", "See dashboard and business reports."),
        entry(PermissionNames.AUDIT_VIEW, "View audit logs", "Administration", "Review system activity logs."),
        entry(PermissionNames.NOTIFICATION_VIEW, "View notifications", "Workspace", "See operational notifications."),
        entry(PermissionNames.TEAM_MANAGE, "Manage team access", "Administration", "Create staff accounts and assign roles."),
        entry(PermissionNames.AI_HELP_VIEW, "Use AI Help", "Workspace", "Ask internal workflow guidance questions.")
    );

    private final RoleRepository roles;

    private final PermissionRepository permissions;

    private final AppUserRepository users;

    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<RoleOptionResponse> listAssignableRoles() {
        return roles.findVisibleRoles(TenantContext.tenantRequired())
            .stream()
            .filter(role -> !OWNER_ROLE.equals(role.getName()))
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<PermissionOptionResponse> listPermissions() {
        return permissions.findAll()
            .stream()
            .map(permission -> {
                PermissionMetadata metadata = PERMISSION_METADATA.getOrDefault(
                    permission.getName(),
                    new PermissionMetadata(permission.getName(), "Other", "System permission")
                );

                return new PermissionOptionResponse(
                    permission.getName(),
                    metadata.label(),
                    metadata.group(),
                    metadata.description(),
                    PERMISSION_DEPENDENCIES.getOrDefault(permission.getName(), Set.of())
                        .stream()
                        .sorted()
                        .toList()
                );
            })
            .sorted(Comparator.comparing(PermissionOptionResponse::group)
                .thenComparing(PermissionOptionResponse::label))
            .toList();
    }

    @Transactional
    public RoleOptionResponse createRole(RoleCreateRequest request) {
        Long tenantId = TenantContext.tenantRequired();
        String name = normalizeName(request.name());
        ensureCustomRoleNameAvailable(name, tenantId, null);

        Role role = Role.builder()
            .tenantId(tenantId)
            .name(name)
            .systemRole(false)
            .permissions(resolvePermissions(request.permissions()))
            .build();

        Role savedRole = roles.save(role);
        auditService.log("ROLE_CREATED", "Role", savedRole.getId(), savedRole.getName());
        return toResponse(savedRole);
    }

    @Transactional
    public RoleOptionResponse updateRole(Long roleId, RoleUpdateRequest request) {
        Long tenantId = TenantContext.tenantRequired();
        Role role = findEditableTenantRole(roleId, tenantId);
        String name = normalizeName(request.name());
        ensureCustomRoleNameAvailable(name, tenantId, roleId);

        role.setName(name);
        role.setPermissions(resolvePermissions(request.permissions()));

        Role savedRole = roles.save(role);
        auditService.log("ROLE_UPDATED", "Role", savedRole.getId(), savedRole.getName());
        return toResponse(savedRole);
    }

    @Transactional
    public void deleteRole(Long roleId) {
        Long tenantId = TenantContext.tenantRequired();
        Role role = findEditableTenantRole(roleId, tenantId);
        if (users.countByRoles_Id(role.getId()) > 0) {
            throw new BusinessException("Role is assigned to team members");
        }

        roles.delete(role);
        auditService.log("ROLE_DELETED", "Role", role.getId(), role.getName());
    }

    private Role findEditableTenantRole(Long roleId, Long tenantId) {
        Role role = roles.findByIdAndTenantId(roleId, tenantId)
            .orElseThrow(() -> new BusinessException("Custom role not found"));

        if (role.isSystemRole()) {
            throw new BusinessException("System roles cannot be changed");
        }

        return role;
    }

    private Set<Permission> resolvePermissions(Set<String> requestedPermissions) {
        Set<String> names = requestedPermissions.stream()
            .map(String::trim)
            .filter(name -> !name.isBlank())
            .collect(Collectors.toSet());

        if (names.isEmpty()) {
            throw new BusinessException("At least one permission is required");
        }

        if (names.stream().anyMatch(OWNER_ONLY_PERMISSIONS::contains)) {
            throw new BusinessException("Team management permission is reserved for Owner accounts");
        }

        Map<String, Permission> permissionMap = permissions.findAll()
            .stream()
            .collect(Collectors.toMap(Permission::getName, Function.identity()));

        if (!permissionMap.keySet().containsAll(names)) {
            throw new BusinessException("Unknown permission selected");
        }

        validatePermissionDependencies(names);

        return names.stream()
            .map(permissionMap::get)
            .collect(Collectors.toCollection(HashSet::new));
    }

    private void validatePermissionDependencies(Set<String> names) {
        PERMISSION_DEPENDENCIES.forEach((permission, requiredPermissions) -> {
            if (!names.contains(permission) || names.containsAll(requiredPermissions)) {
                return;
            }

            String missing = requiredPermissions.stream()
                .filter(required -> !names.contains(required))
                .sorted()
                .collect(Collectors.joining(", "));
            throw new BusinessException(permission + " requires: " + missing);
        });
    }

    private void ensureCustomRoleNameAvailable(String name, Long tenantId, Long currentRoleId) {
        if (SYSTEM_ROLE_NAMES.stream().anyMatch(systemName -> systemName.equalsIgnoreCase(name))) {
            throw new BusinessException("System role names are reserved");
        }

        boolean nameTaken = roles.findVisibleRoles(tenantId)
            .stream()
            .anyMatch(role -> role.getName().equalsIgnoreCase(name)
                && (currentRoleId == null || !role.getId().equals(currentRoleId)));

        if (nameTaken) {
            throw new BusinessException("Role name already exists");
        }
    }

    private String normalizeName(String name) {
        String normalized = name.trim().replaceAll("\\s+", " ");

        if (normalized.isBlank()) {
            throw new BusinessException("Role name is required");
        }

        return normalized;
    }

    private RoleOptionResponse toResponse(Role role) {
        return new RoleOptionResponse(
            role.getId(),
            role.getName(),
            role.isSystemRole(),
            !role.isSystemRole() && role.getTenantId() != null,
            role.getPermissions()
                .stream()
                .map(Permission::getName)
                .sorted()
                .toList()
        );
    }

    private static Map.Entry<String, PermissionMetadata> entry(
        String name,
        String label,
        String group,
        String description
    ) {
        return Map.entry(name, new PermissionMetadata(label, group, description));
    }

    private record PermissionMetadata(String label, String group, String description) {
    }
}
