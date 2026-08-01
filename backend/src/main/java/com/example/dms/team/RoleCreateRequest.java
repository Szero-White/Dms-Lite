package com.example.dms.team;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.Set;

public record RoleCreateRequest(
    @NotBlank
    @Size(max = 100, message = "Role name must be 100 characters or less")
    String name,
    @NotEmpty Set<String> permissions
) {
}
