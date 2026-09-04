import type { TFunction } from 'i18next';

const SYSTEM_ROLE_KEYS: Record<string, string> = {
  OWNER: 'roles.OWNER',
  SALE_STAFF: 'roles.SALE_STAFF',
  WAREHOUSE_STAFF: 'roles.WAREHOUSE_STAFF',
  ACCOUNTANT: 'roles.ACCOUNTANT',
  USER: 'roles.USER',
};

export function roleLabel(role: string | null | undefined, t: TFunction) {
  if (!role) {
    return t('roles.USER');
  }

  const key = SYSTEM_ROLE_KEYS[role];
  return key ? t(key) : role;
}

export function roleListLabel(roles: string[] | null | undefined, t: TFunction) {
  if (!roles?.length) {
    return t('roles.USER');
  }

  return roles.map((role) => roleLabel(role, t)).join(', ');
}
