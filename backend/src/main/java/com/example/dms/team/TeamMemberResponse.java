package com.example.dms.team;

import java.util.List;

public record TeamMemberResponse(
    Long id,
    String username,
    String fullName,
    boolean active,
    List<String> roles,
    List<String> permissions
) {
}