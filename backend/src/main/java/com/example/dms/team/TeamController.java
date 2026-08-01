package com.example.dms.team;

import com.example.dms.common.ApiResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/team")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('TEAM_MANAGE')")
public class TeamController {

    private final TeamService teamService;

    private final RoleManagementService roleManagementService;

    @GetMapping("/members")
    public ApiResponse<List<TeamMemberResponse>> listMembers() {
        return ApiResponse.ok(teamService.listMembers());
    }

    @GetMapping("/roles")
    public ApiResponse<List<RoleOptionResponse>> listRoles() {
        return ApiResponse.ok(roleManagementService.listAssignableRoles());
    }

    @GetMapping("/permissions")
    public ApiResponse<List<PermissionOptionResponse>> listPermissions() {
        return ApiResponse.ok(roleManagementService.listPermissions());
    }

    @PostMapping("/roles")
    public ApiResponse<RoleOptionResponse> createRole(@Valid @RequestBody RoleCreateRequest request) {
        return ApiResponse.ok(roleManagementService.createRole(request));
    }

    @PutMapping("/roles/{id}")
    public ApiResponse<RoleOptionResponse> updateRole(
        @PathVariable Long id,
        @Valid @RequestBody RoleUpdateRequest request
    ) {
        return ApiResponse.ok(roleManagementService.updateRole(id, request));
    }

    @DeleteMapping("/roles/{id}")
    public ApiResponse<Void> deleteRole(@PathVariable Long id) {
        roleManagementService.deleteRole(id);
        return ApiResponse.ok(null);
    }

    @PostMapping("/members")
    public ApiResponse<TeamMemberResponse> createMember(
        @Valid @RequestBody TeamMemberCreateRequest request
    ) {
        return ApiResponse.ok(teamService.createMember(request));
    }

    @PutMapping("/members/{id}")
    public ApiResponse<TeamMemberResponse> updateMember(
        @PathVariable Long id,
        @Valid @RequestBody TeamMemberUpdateRequest request
    ) {
        return ApiResponse.ok(teamService.updateMember(id, request));
    }

    @DeleteMapping("/members/{id}")
    public ApiResponse<TeamMemberResponse> deactivateMember(@PathVariable Long id) {
        return ApiResponse.ok(teamService.deactivateMember(id));
    }
}
