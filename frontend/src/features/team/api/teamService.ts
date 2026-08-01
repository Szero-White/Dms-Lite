import { apiClient, unwrapResponse } from '../../../services/apiClient';
import type {
  PermissionOption,
  RoleFormPayload,
  RoleOption,
  TeamMember,
  TeamMemberCreatePayload,
  TeamMemberUpdatePayload,
} from '../types/team.types';

export async function fetchTeamMembers() {
  return unwrapResponse<TeamMember[]>(apiClient.get('/team/members'));
}

export async function fetchTeamRoles() {
  return unwrapResponse<RoleOption[]>(apiClient.get('/team/roles'));
}

export async function fetchTeamPermissions() {
  return unwrapResponse<PermissionOption[]>(apiClient.get('/team/permissions'));
}

export async function createTeamRole(payload: RoleFormPayload) {
  return unwrapResponse<RoleOption>(apiClient.post('/team/roles', payload));
}

export async function updateTeamRole(roleId: number, payload: RoleFormPayload) {
  return unwrapResponse<RoleOption>(apiClient.put(`/team/roles/${roleId}`, payload));
}

export async function deleteTeamRole(roleId: number) {
  return unwrapResponse<void>(apiClient.delete(`/team/roles/${roleId}`));
}

export async function createTeamMember(payload: TeamMemberCreatePayload) {
  return unwrapResponse<TeamMember>(apiClient.post('/team/members', payload));
}

export async function updateTeamMember(userId: number, payload: TeamMemberUpdatePayload) {
  return unwrapResponse<TeamMember>(apiClient.put(`/team/members/${userId}`, payload));
}

export async function deactivateTeamMember(userId: number) {
  return unwrapResponse<TeamMember>(apiClient.delete(`/team/members/${userId}`));
}
