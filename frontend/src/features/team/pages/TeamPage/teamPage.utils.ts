import type { PermissionOption, TeamMember } from '../../types/team.types';

export const OWNER_ONLY_PERMISSIONS = new Set(['TEAM_MANAGE']);

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  SALE_STAFF: 'Sales',
  WAREHOUSE_STAFF: 'Warehouse',
  ACCOUNTANT: 'Accountant',
};

export function roleLabel(role: string) {
  return ROLE_LABELS[role] ?? role;
}

export function isOwner(member: TeamMember) {
  return member.roles.includes('OWNER');
}

export function groupPermissions(permissions: PermissionOption[]) {
  return permissions.reduce<Record<string, PermissionOption[]>>((groups, permission) => {
    groups[permission.group] = [...(groups[permission.group] ?? []), permission];
    return groups;
  }, {});
}
