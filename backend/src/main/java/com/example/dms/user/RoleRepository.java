package com.example.dms.user;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByName(String name);

    Optional<Role> findByNameAndTenantId(String name, Long tenantId);

    Optional<Role> findByNameAndTenantIdIsNull(String name);

    Optional<Role> findByIdAndTenantId(Long id, Long tenantId);

    List<Role> findByTenantIdOrderByNameAsc(Long tenantId);

    List<Role> findByTenantIdIsNullAndSystemRoleTrueOrderByNameAsc();

    @Query("""
        select role from Role role
        where role.tenantId = :tenantId
           or (role.tenantId is null and role.systemRole = true)
        order by role.systemRole desc, role.name asc
        """)
    List<Role> findVisibleRoles(@Param("tenantId") Long tenantId);
}
