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

        AppUser appUser = appUserRepository.findByUsername(request.username()).orElseThrow();
        return ApiResponse.ok(
            new AuthResponse(
                jwtService.token(appUser),
                appUser.getId(),
                appUser.getTenantId(),
                appUser.getUsername(),
                appUser.getFullName(),
                appUser.getRoles().stream().map(Role::getName).toList(),
                appUser.getRoles()
                    .stream()
                    .flatMap(role -> role.getPermissions().stream())
                    .map(Permission::getName)
                    .distinct()
                    .toList()
            )
        );
    }
}
