package com.example.dms.team;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.dms.audit.AuditService;
import com.example.dms.common.TenantContext;
import com.example.dms.seed.DemoProperties;
import com.example.dms.user.AppUser;
import com.example.dms.user.AppUserRepository;
import com.example.dms.user.Role;
import com.example.dms.user.RoleRepository;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class TeamServiceTest {

    @Mock private AppUserRepository users;
    @Mock private RoleRepository roles;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuditService auditService;
    @Mock private DemoProperties demoProperties;

    private TeamService teamService;

    @BeforeEach
    void setUp() {
        teamService = new TeamService(users, roles, passwordEncoder, auditService, demoProperties);
        TenantContext.set(1L, 99L);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void updatesUsernameAndPasswordForManageableStaff() {
        Role staffRole = Role.builder()
            .id(7L)
            .tenantId(1L)
            .name("SUPERVISOR")
            .permissions(Set.of())
            .build();
        AppUser member = AppUser.builder()
            .id(10L)
            .tenantId(1L)
            .username("giamsat")
            .fullName("Nguyen Minh An")
            .passwordHash("OLD_HASH")
            .active(true)
            .roles(Set.of(staffRole))
            .build();

        when(users.findByIdAndTenantId(10L, 1L)).thenReturn(Optional.of(member));
        when(users.findByUsername("giamsat.moi")).thenReturn(Optional.empty());
        when(roles.findVisibleRoles(1L)).thenReturn(java.util.List.of(staffRole));
        when(passwordEncoder.encode("NewPass@2026")).thenReturn("NEW_HASH");
        when(users.save(member)).thenReturn(member);

        TeamMemberResponse response = teamService.updateMember(
            10L,
            new TeamMemberUpdateRequest(
                "  GiamSat.Moi  ",
                "Nguyen Minh An",
                "NewPass@2026",
                Set.of("SUPERVISOR"),
                true
            )
        );

        assertThat(member.getUsername()).isEqualTo("giamsat.moi");
        assertThat(member.getPasswordHash()).isEqualTo("NEW_HASH");
        assertThat(response.manageable()).isTrue();
        verify(auditService).log("TEAM_MEMBER_UPDATED", "AppUser", 10L, "giamsat.moi");
    }

    @Test
    void leavingPasswordEmptyKeepsExistingPasswordHash() {
        Role staffRole = Role.builder()
            .id(7L)
            .tenantId(1L)
            .name("SUPERVISOR")
            .permissions(Set.of())
            .build();
        AppUser member = AppUser.builder()
            .id(10L)
            .tenantId(1L)
            .username("giamsat")
            .fullName("Nguyen Minh An")
            .passwordHash("OLD_HASH")
            .active(true)
            .roles(Set.of(staffRole))
            .build();

        when(users.findByIdAndTenantId(10L, 1L)).thenReturn(Optional.of(member));
        when(users.findByUsername("giamsat")).thenReturn(Optional.of(member));
        when(roles.findVisibleRoles(1L)).thenReturn(java.util.List.of(staffRole));
        when(users.save(member)).thenReturn(member);

        teamService.updateMember(
            10L,
            new TeamMemberUpdateRequest(
                "giamsat",
                "Nguyen Minh An",
                null,
                Set.of("SUPERVISOR"),
                true
            )
        );

        assertThat(member.getPasswordHash()).isEqualTo("OLD_HASH");
    }
}
