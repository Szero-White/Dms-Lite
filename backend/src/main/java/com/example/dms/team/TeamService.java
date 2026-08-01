package com.example.dms.team;

import com.example.dms.audit.AuditService;
import com.example.dms.common.BusinessException;
import com.example.dms.common.TenantContext;
import com.example.dms.user.AppUser;
import com.example.dms.user.AppUserRepository;
import com.example.dms.user.Permission;
import com.example.dms.user.Role;
import com.example.dms.user.RoleRepository;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TeamService {

    private static final String OWNER_ROLE = "OWNER";

    private final AppUserRepository users;

    private final RoleRepository roles;

    private final PasswordEncoder passwordEncoder;

    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<TeamMemberResponse> listMembers() {
        Long tenantId = TenantContext.tenantRequired();
        return users.findByTenantIdOrderByUsernameAsc(tenantId)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public TeamMemberResponse createMember(TeamMemberCreateRequest request) {
        String username = normalizeUsername(request.username());
        users.findByUsername(username)
            .ifPresent(user -> {
                throw new BusinessException("Username already exists");
            });

        AppUser user = AppUser.builder()
            .username(username)
            .fullName(request.fullName().trim())
            .passwordHash(passwordEncoder.encode(request.password()))
            .tenantId(TenantContext.tenantRequired())
            .active(request.active())
            .roles(resolveAssignableRoles(request.roles()))
            .build();

        AppUser savedUser = users.save(user);
        auditService.log("TEAM_MEMBER_CREATED", "AppUser", savedUser.getId(), savedUser.getUsername());
        return toResponse(savedUser);
    }

    @Transactional
    public TeamMemberResponse updateMember(Long userId, TeamMemberUpdateRequest request) {
        AppUser user = findTenantMember(userId);
        ensureManageableStaff(user);

        user.setFullName(request.fullName().trim());
        user.setActive(request.active());
        user.setRoles(resolveAssignableRoles(request.roles()));

        AppUser savedUser = users.save(user);
        auditService.log("TEAM_MEMBER_UPDATED", "AppUser", savedUser.getId(), savedUser.getUsername());
        return toResponse(savedUser);
    }

    @Transactional
    public TeamMemberResponse deactivateMember(Long userId) {
        AppUser user = findTenantMember(userId);
        ensureManageableStaff(user);
        user.setActive(false);

        AppUser savedUser = users.save(user);
        auditService.log("TEAM_MEMBER_DEACTIVATED", "AppUser", savedUser.getId(), savedUser.getUsername());
        return toResponse(savedUser);
    }

    private AppUser findTenantMember(Long userId) {
        return users.findByIdAndTenantId(userId, TenantContext.tenantRequired())
            .orElseThrow(() -> new BusinessException("Team member not found"));
    }

    private void ensureManageableStaff(AppUser user) {
        if (user.getId().equals(TenantContext.user())) {
            throw new BusinessException("You cannot change your own access from Team Management");
        }

        boolean isOwner = user.getRoles()
            .stream()
            .map(Role::getName)
            .anyMatch(OWNER_ROLE::equals);

        if (isOwner) {
            throw new BusinessException("Owner access cannot be changed from Team Management");
        }
    }

    private Set<Role> resolveAssignableRoles(Set<String> roleNames) {
        Long tenantId = TenantContext.tenantRequired();
        Set<String> normalizedRoleNames = roleNames.stream()
            .map(roleName -> roleName.trim().toLowerCase(Locale.ROOT))
            .filter(roleName -> !roleName.isBlank())
            .collect(Collectors.toSet());

        if (normalizedRoleNames.isEmpty()) {
            throw new BusinessException("At least one role is required");
        }

        Map<String, Role> visibleRoles = roles.findVisibleRoles(tenantId)
            .stream()
            .filter(role -> !OWNER_ROLE.equals(role.getName()))
            .collect(Collectors.toMap(
                role -> role.getName().toLowerCase(Locale.ROOT),
                Function.identity()
            ));

        if (!visibleRoles.keySet().containsAll(normalizedRoleNames)) {
            throw new BusinessException("Only visible staff roles can be assigned from Team Management");
        }

        return normalizedRoleNames.stream()
            .map(visibleRoles::get)
            .collect(Collectors.toCollection(HashSet::new));
    }

    private String normalizeUsername(String username) {
        return username.trim().toLowerCase(Locale.ROOT);
    }

    private TeamMemberResponse toResponse(AppUser user) {
        List<String> roleNames = user.getRoles()
            .stream()
            .map(Role::getName)
            .sorted()
            .toList();
        List<String> permissionNames = user.getRoles()
            .stream()
            .flatMap(role -> role.getPermissions().stream())
            .map(Permission::getName)
            .distinct()
            .sorted(Comparator.naturalOrder())
            .toList();

        return new TeamMemberResponse(
            user.getId(),
            user.getUsername(),
            user.getFullName(),
            user.isActive(),
            roleNames,
            permissionNames
        );
    }
}
