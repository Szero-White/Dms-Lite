package com.example.dms.team;

import java.util.List;

public record PermissionOptionResponse(
    String name,
    String label,
    String group,
    String description,
    List<String> requires
) {
}
