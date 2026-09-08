import type { PermissionOption } from '../../types/team.types';

export const OWNER_ONLY_PERMISSIONS = new Set(['TEAM_MANAGE']);

export function groupPermissions(permissions: PermissionOption[]) {
  return permissions.reduce<Record<string, PermissionOption[]>>((groups, permission) => {
    groups[permission.group] = [...(groups[permission.group] ?? []), permission];
    return groups;
  }, {});
}
