package com.example.dms.auth;

import com.example.dms.common.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import lombok.RequiredArgsConstructor;
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

    private final AuthSessionService authSessionService;

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
        AuthSessionService.AuthenticatedSession authenticated = authSessionService.login(
            request.username(),
            request.password()
        );
        AuthSessionService.Session session = authenticated.session();

        return ApiResponse.ok(
            new AuthResponse(
                authenticated.accessToken(),
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
        AuthSessionService.Session session = authSessionService.currentSession(authentication.getName());
        return ApiResponse.ok(
            new SessionResponse(
                session.userId(),
                session.tenantId(),
                session.username(),
                session.fullName(),
                session.roles(),
                session.permissions()
            )
        );
    }
}
