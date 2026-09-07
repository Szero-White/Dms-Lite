package com.example.dms.auth;

import com.example.dms.common.ApiResponse;
import com.example.dms.user.AppUser;
import com.example.dms.user.AppUserRepository;
import com.example.dms.user.Permission;
import com.example.dms.user.Role;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;

    private final AppUserRepository appUserRepository;

    private final JwtService jwtService;

    public record LoginRequest(
        @NotBlank String username,
        @NotBlank String password
    ) {
    }

    public record SessionResponse(
        Long userId,
        Long tenantId,
        String username,
        String fullName,
        List<String> roles,
        List<String> permissions
    ) {
    }

    public record AuthResponse(
        String accessToken,
        Long userId,
        Long tenantId,
        String username,
        String fullName,
        List<String> roles,
        List<String> permissions
    ) {
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );

        AppUser appUser = findByUsername(request.username());
        SessionResponse session = toSessionResponse(appUser);

        return ApiResponse.ok(
            new AuthResponse(
                jwtService.token(appUser),
                session.userId(),
                session.tenantId(),
                session.username(),
                session.fullName(),
                session.roles(),
                session.permissions()
            )
        );
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<SessionResponse> currentSession(Authentication authentication) {
        AppUser appUser = findByUsername(authentication.getName());
        return ApiResponse.ok(toSessionResponse(appUser));
    }

    private AppUser findByUsername(String username) {
        return appUserRepository.findByUsername(username).orElseThrow();
    }

    private SessionResponse toSessionResponse(AppUser appUser) {
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

        return new SessionResponse(
            appUser.getId(),
            appUser.getTenantId(),
            appUser.getUsername(),
            appUser.getFullName(),
            roles,
            permissions
        );
    }
}
