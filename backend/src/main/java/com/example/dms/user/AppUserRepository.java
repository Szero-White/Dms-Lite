package com.example.dms.user;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {

    Optional<AppUser> findByUsername(String username);

    Optional<AppUser> findByIdAndTenantId(Long id, Long tenantId);

    List<AppUser> findByTenantIdOrderByUsernameAsc(Long tenantId);

    List<AppUser> findByTenantIdAndIdIn(Long tenantId, Collection<Long> ids);

    long countByRoles_Id(Long roleId);
}
