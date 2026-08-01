package com.example.dms.team;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.Set;

public record TeamMemberCreateRequest(
    @NotBlank String username,
    @NotBlank String fullName,
    @NotBlank
    @Size(min = 8, message = "Password must be at least 8 characters")
    String password,
    @NotEmpty Set<String> roles,
    boolean active
) {
}
