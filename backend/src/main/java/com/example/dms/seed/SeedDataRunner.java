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
import com.example.dms.user.PermissionRepository;
import com.example.dms.user.Role;
import com.example.dms.user.RoleRepository;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class SeedDataRunner implements CommandLineRunner {

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
        if (users.count() > 0) {
            return;
        }

        Tenant tenant = tenants.save(Tenant.builder().name("Demo Distributor").active(true).build());

        List<String> permissionNames = List.of(
            "PRODUCT_VIEW",
            "PRODUCT_MANAGE",
            "CUSTOMER_VIEW",
            "CUSTOMER_MANAGE",
            "SALES_ORDER_CREATE",
            "SALES_ORDER_CONFIRM",
            "INVENTORY_VIEW",
            "PAYMENT_CREATE",
            "DEBT_VIEW",
            "REPORT_VIEW"
        );

        Set<Permission> allPermissions = new HashSet<>();
        for (String permissionName : permissionNames) {
            allPermissions.add(perms.save(Permission.builder().name(permissionName).build()));
        }

        Role ownerRole = roles.save(
            Role.builder()
                .name("OWNER")
                .permissions(allPermissions)
                .build()
        );

        Role saleRole = roles.save(
            Role.builder()
                .name("SALE_STAFF")
                .permissions(new HashSet<>(allPermissions))
                .build()
        );

        users.save(
            AppUser.builder()
                .username("owner")
                .passwordHash(encoder.encode("123456"))
                .fullName("Owner")
                .tenantId(tenant.getId())
                .active(true)
                .roles(Set.of(ownerRole))
                .build()
        );

        users.save(
            AppUser.builder()
                .username("sale")
                .passwordHash(encoder.encode("123456"))
                .fullName("Sale")
                .tenantId(tenant.getId())
                .active(true)
                .roles(Set.of(saleRole))
                .build()
        );

        users.save(
            AppUser.builder()
                .username("warehouse")
                .passwordHash(encoder.encode("123456"))
                .fullName("Warehouse")
                .tenantId(tenant.getId())
                .active(true)
                .roles(Set.of(ownerRole))
                .build()
        );

        users.save(
            AppUser.builder()
                .username("accountant")
                .passwordHash(encoder.encode("123456"))
                .fullName("Accountant")
                .tenantId(tenant.getId())
                .active(true)
                .roles(Set.of(ownerRole))
                .build()
        );

        emh.insertWarehouse(tenant.getId());

        Product firstProduct = products.save(
            Product.builder()
                .tenantId(tenant.getId())
                .name("NÆ°á»›c suá»‘i thÃ¹ng 24 chai")
                .sku("WATER-24")
                .costPrice(new BigDecimal("65000"))
                .sellingPrice(new BigDecimal("80000"))
                .minStock(10)
                .active(true)
                .build()
        );

        Product secondProduct = products.save(
            Product.builder()
                .tenantId(tenant.getId())
                .name("TrÃ  xanh thÃ¹ng 24 chai")
                .sku("TEA-24")
                .costPrice(new BigDecimal("120000"))
                .sellingPrice(new BigDecimal("150000"))
                .minStock(8)
                .active(true)
                .build()
        );

        inventory.increase(
            tenant.getId(),
            1L,
            firstProduct.getId(),
            50,
            "ADJUSTMENT",
            null,
            "Seed stock"
        );
        inventory.increase(
            tenant.getId(),
            1L,
            secondProduct.getId(),
            30,
            "ADJUSTMENT",
            null,
            "Seed stock"
        );

        customers.save(
            Customer.builder()
                .tenantId(tenant.getId())
                .name("Táº¡p hÃ³a CÃ´ Lan")
                .phone("0909000001")
                .address("Quáº­n 1")
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

    void insertWarehouse(Long tenantId) {
        em.createNativeQuery("insert into warehouses(tenant_id,name) values(:t,'Kho chÃ­nh')")
            .setParameter("t", tenantId)
            .executeUpdate();
    }
}
