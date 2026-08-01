package com.example.dms.team;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.Set;

public record TeamMemberUpdateRequest(
    @NotBlank String fullName,
    @NotEmpty Set<String> roles,
    boolean active
) {
}