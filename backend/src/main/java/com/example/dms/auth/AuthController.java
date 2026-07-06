package com.example.dms.auth;
import com.example.dms.common.*;import com.example.dms.user.*;import jakarta.validation.constraints.*;import lombok.*;import org.springframework.security.authentication.*;import org.springframework.web.bind.annotation.*;import java.util.*;
@RestController @RequestMapping("/api/auth") @RequiredArgsConstructor
public class AuthController {
 private final AuthenticationManager am; private final AppUserRepository users; private final JwtService jwt;
 public record LoginRequest(@NotBlank String username,@NotBlank String password){}
 public record AuthResponse(String accessToken,Long userId,Long tenantId,String username,String fullName,List<String> roles,List<String> permissions){}
 @PostMapping("/login") ApiResponse<AuthResponse> login(@RequestBody LoginRequest r){am.authenticate(new UsernamePasswordAuthenticationToken(r.username(),r.password()));AppUser u=users.findByUsername(r.username()).orElseThrow();return ApiResponse.ok(new AuthResponse(jwt.token(u),u.getId(),u.getTenantId(),u.getUsername(),u.getFullName(),u.getRoles().stream().map(Role::getName).toList(),u.getRoles().stream().flatMap(x->x.getPermissions().stream()).map(Permission::getName).distinct().toList()));}
}
