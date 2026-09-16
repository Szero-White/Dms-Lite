package com.example.dms.auth;

import com.example.dms.user.AppUser;
import com.example.dms.user.AppUserRepository;
import com.example.dms.user.Permission;
import com.example.dms.user.Role;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthSessionService {

    private final AuthenticationManager authenticationManager;
    private final AppUserRepository appUserRepository;
    private final JwtService jwtService;

    @Transactional(readOnly = true)
    public AuthenticatedSession login(String username, String password) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(username, password)
        );

        AppUser appUser = findByUsername(username);
        return new AuthenticatedSession(jwtService.token(appUser), toSession(appUser));
    }

    @Transactional(readOnly = true)
    public Session currentSession(String username) {
        return toSession(findByUsername(username));
    }

    private AppUser findByUsername(String username) {
        return appUserRepository.findByUsername(username).orElseThrow();
    }

    private Session toSession(AppUser appUser) {
        List<String> roles = appUser.getRoles()
            .stream()
            .map(Role::getName)
            .distinct()
            .sorted()
            .toList();
        List<String> permissions = appUser.getRoles()
            .stream()
            .flatMap(role -> role.getPermissions().stream())
            .map(Permission::getName)
            .distinct()
            .sorted()
            .toList();

        return new Session(
            appUser.getId(),
            appUser.getTenantId(),
            appUser.getUsername(),
            appUser.getFullName(),
            roles,
            permissions
        );
    }

    public record Session(
        Long userId,
        Long tenantId,
        String username,
        String fullName,
        List<String> roles,
        List<String> permissions
    ) {
    }

    public record AuthenticatedSession(String accessToken, Session session) {
    }
}
