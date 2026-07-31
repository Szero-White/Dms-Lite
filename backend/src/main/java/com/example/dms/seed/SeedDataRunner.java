package com.example.dms.seed;

import com.example.dms.customer.Customer;
import com.example.dms.customer.CustomerRepository;
import com.example.dms.inventory.InventoryService;
import com.example.dms.product.Product;
import com.example.dms.product.ProductRepository;
import com.example.dms.tenant.Tenant;
import com.example.dms.tenant.TenantRepository;
import com.example.dms.user.AppUser;
import com.example.dms.user.AppUserRepository;
import com.example.dms.user.Permission;
import com.example.dms.user.PermissionNames;
import com.example.dms.user.PermissionRepository;
import com.example.dms.user.Role;
import com.example.dms.user.RoleRepository;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class SeedDataRunner implements CommandLineRunner {

    private static final String OWNER = "OWNER";

    private static final String SALES = "SALE_STAFF";

    private static final String WAREHOUSE = "WAREHOUSE_STAFF";

    private static final String ACCOUNTANT = "ACCOUNTANT";

    private static final String DEMO_PASSWORD = "123456";

    private final TenantRepository tenants;

    private final PermissionRepository perms;

    private final RoleRepository roles;

    private final AppUserRepository users;

    private final PasswordEncoder encoder;

    private final ProductRepository products;

    private final CustomerRepository customers;

    private final InventoryService inventory;

    private final EntityManagerHelper emh;

    @Override
    @Transactional
    public void run(String... args) {
        Tenant tenant = tenants.findAll()
            .stream()
            .findFirst()
            .orElseGet(() -> tenants.save(Tenant.builder().name("Demo Distributor").active(true).build()));

        Map<String, Permission> permissionMap = ensurePermissions();
        Role ownerRole = ensureRole(OWNER, permissionMap, PermissionNames.PRODUCT_VIEW,
            PermissionNames.PRODUCT_MANAGE, PermissionNames.CUSTOMER_VIEW,
            PermissionNames.CUSTOMER_MANAGE, PermissionNames.SALES_ORDER_VIEW,
            PermissionNames.SALES_ORDER_CREATE, PermissionNames.SALES_ORDER_CONFIRM,
            PermissionNames.SALES_ORDER_CANCEL, PermissionNames.INVENTORY_VIEW,
            PermissionNames.INVENTORY_MANAGE, PermissionNames.PAYMENT_CREATE,
            PermissionNames.DEBT_VIEW, PermissionNames.REPORT_VIEW, PermissionNames.AUDIT_VIEW,
            PermissionNames.NOTIFICATION_VIEW);
        Role salesRole = ensureRole(SALES, permissionMap, PermissionNames.PRODUCT_VIEW,
            PermissionNames.CUSTOMER_VIEW, PermissionNames.CUSTOMER_MANAGE,
            PermissionNames.SALES_ORDER_VIEW, PermissionNames.SALES_ORDER_CREATE,
            PermissionNames.SALES_ORDER_CANCEL, PermissionNames.INVENTORY_VIEW,
            PermissionNames.REPORT_VIEW, PermissionNames.NOTIFICATION_VIEW);
        Role warehouseRole = ensureRole(WAREHOUSE, permissionMap, PermissionNames.PRODUCT_VIEW,
            PermissionNames.SALES_ORDER_VIEW, PermissionNames.SALES_ORDER_CONFIRM,
            PermissionNames.INVENTORY_VIEW, PermissionNames.INVENTORY_MANAGE,
            PermissionNames.NOTIFICATION_VIEW);
        Role accountantRole = ensureRole(ACCOUNTANT, permissionMap, PermissionNames.PRODUCT_VIEW,
            PermissionNames.CUSTOMER_VIEW, PermissionNames.SALES_ORDER_VIEW,
            PermissionNames.PAYMENT_CREATE, PermissionNames.DEBT_VIEW,
            PermissionNames.REPORT_VIEW, PermissionNames.NOTIFICATION_VIEW);

        ensureDemoUser("owner", "Owner", tenant.getId(), ownerRole);
        ensureDemoUser("sale", "Sale", tenant.getId(), salesRole);
        ensureDemoUser("warehouse", "Warehouse", tenant.getId(), warehouseRole);
        ensureDemoUser("accountant", "Accountant", tenant.getId(), accountantRole);

        if (!emh.hasWarehouse(tenant.getId())) {
            emh.insertWarehouse(tenant.getId());
        }

        seedBusinessData(tenant.getId());
    }

    private Map<String, Permission> ensurePermissions() {
        Set<String> names = Set.of(
            PermissionNames.PRODUCT_VIEW,
            PermissionNames.PRODUCT_MANAGE,
            PermissionNames.CUSTOMER_VIEW,
            PermissionNames.CUSTOMER_MANAGE,
            PermissionNames.SALES_ORDER_VIEW,
            PermissionNames.SALES_ORDER_CREATE,
            PermissionNames.SALES_ORDER_CONFIRM,
            PermissionNames.SALES_ORDER_CANCEL,
            PermissionNames.INVENTORY_VIEW,
            PermissionNames.INVENTORY_MANAGE,
            PermissionNames.PAYMENT_CREATE,
            PermissionNames.DEBT_VIEW,
            PermissionNames.REPORT_VIEW,
            PermissionNames.AUDIT_VIEW,
            PermissionNames.NOTIFICATION_VIEW
        );

        names.forEach(name -> perms.findByName(name)
            .orElseGet(() -> perms.save(Permission.builder().name(name).build())));

        return perms.findAll()
            .stream()
            .collect(Collectors.toMap(Permission::getName, Function.identity()));
    }

    private Role ensureRole(
        String roleName,
        Map<String, Permission> permissionMap,
        String... permissionNames
    ) {
        Role role = roles.findByName(roleName)
            .orElseGet(() -> roles.save(Role.builder().name(roleName).build()));
        role.setPermissions(Arrays.stream(permissionNames)
            .map(permissionMap::get)
            .collect(Collectors.toSet()));
        return roles.save(role);
    }

    private void ensureDemoUser(String username, String fullName, Long tenantId, Role role) {
        AppUser user = users.findByUsername(username)
            .orElseGet(() -> AppUser.builder()
                .username(username)
                .passwordHash(encoder.encode(DEMO_PASSWORD))
                .build());

        user.setFullName(fullName);
        user.setTenantId(tenantId);
        user.setActive(true);
        user.setRoles(new HashSet<>(Set.of(role)));
        users.save(user);
    }

    private void seedBusinessData(Long tenantId) {
        if (products.count() > 0 || customers.count() > 0) {
            return;
        }

        Product firstProduct = products.save(
            Product.builder()
                .tenantId(tenantId)
                .name("Nuoc suoi thung 24 chai")
                .sku("WATER-24")
                .costPrice(new BigDecimal("65000"))
                .sellingPrice(new BigDecimal("80000"))
                .minStock(10)
                .active(true)
                .build()
        );

        Product secondProduct = products.save(
            Product.builder()
                .tenantId(tenantId)
                .name("Tra xanh thung 24 chai")
                .sku("TEA-24")
                .costPrice(new BigDecimal("120000"))
                .sellingPrice(new BigDecimal("150000"))
                .minStock(8)
                .active(true)
                .build()
        );

        inventory.increase(
            tenantId,
            1L,
            firstProduct.getId(),
            50,
            "ADJUSTMENT",
            null,
            "Seed stock"
        );
        inventory.increase(
            tenantId,
            1L,
            secondProduct.getId(),
            30,
            "ADJUSTMENT",
            null,
            "Seed stock"
        );

        customers.save(
            Customer.builder()
                .tenantId(tenantId)
                .name("Tap hoa Co Lan")
                .phone("0909000001")
                .address("Quan 1")
                .creditLimit(new BigDecimal("20000000"))
                .paymentTermDays(14)
                .active(true)
                .build()
        );
    }
}

@Component
@RequiredArgsConstructor
class EntityManagerHelper {

    private final EntityManager em;

    boolean hasWarehouse(Long tenantId) {
        Number count = (Number) em.createNativeQuery(
                "select count(*) from warehouses where tenant_id=:tenantId"
            )
            .setParameter("tenantId", tenantId)
            .getSingleResult();

        return count.longValue() > 0;
    }

    void insertWarehouse(Long tenantId) {
        em.createNativeQuery("insert into warehouses(tenant_id,name) values(:t,'Kho chinh')")
            .setParameter("t", tenantId)
            .executeUpdate();
    }
}
