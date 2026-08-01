package com.example.dms.team;

import java.util.List;

public record RoleOptionResponse(
    Long id,
    String name,
    boolean systemRole,
    boolean editable,
    List<String> permissions
) {
}
