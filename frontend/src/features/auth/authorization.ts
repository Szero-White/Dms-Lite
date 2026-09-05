import type { AuthUser } from './types/auth.types';

export const PERMISSIONS = {
  PRODUCT_VIEW: 'PRODUCT_VIEW',
  PRODUCT_MANAGE: 'PRODUCT_MANAGE',
  CUSTOMER_VIEW: 'CUSTOMER_VIEW',
  CUSTOMER_MANAGE: 'CUSTOMER_MANAGE',
  SALES_ORDER_VIEW: 'SALES_ORDER_VIEW',
  SALES_ORDER_CREATE: 'SALES_ORDER_CREATE',
  SALES_ORDER_CONFIRM: 'SALES_ORDER_CONFIRM',
  SALES_ORDER_CANCEL: 'SALES_ORDER_CANCEL',
  INVENTORY_VIEW: 'INVENTORY_VIEW',
  INVENTORY_MANAGE: 'INVENTORY_MANAGE',
  PAYMENT_CREATE: 'PAYMENT_CREATE',
  DEBT_VIEW: 'DEBT_VIEW',
  REPORT_VIEW: 'REPORT_VIEW',
  AUDIT_VIEW: 'AUDIT_VIEW',
  NOTIFICATION_VIEW: 'NOTIFICATION_VIEW',
  TEAM_MANAGE: 'TEAM_MANAGE',
  AI_HELP_VIEW: 'AI_HELP_VIEW',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
type RoutePermission = Permission | Permission[];

export const NO_WORKSPACE_PATH = '/no-access';

const ORDER_FINANCIAL_PERMISSIONS: Permission[] = [
  PERMISSIONS.DEBT_VIEW,
  PERMISSIONS.PAYMENT_CREATE,
  PERMISSIONS.REPORT_VIEW,
  PERMISSIONS.SALES_ORDER_CREATE,
];

const CUSTOMER_BALANCE_PERMISSIONS: Permission[] = [
  PERMISSIONS.DEBT_VIEW,
  PERMISSIONS.PAYMENT_CREATE,
  PERMISSIONS.REPORT_VIEW,
  PERMISSIONS.SALES_ORDER_CREATE,
];

const PRODUCT_FINANCIAL_PERMISSIONS: Permission[] = [
  PERMISSIONS.PRODUCT_MANAGE,
  PERMISSIONS.REPORT_VIEW,
];

export const ROUTE_PERMISSIONS: Record<string, RoutePermission> = {
  '/dashboard': PERMISSIONS.REPORT_VIEW,
  '/sales-orders': PERMISSIONS.SALES_ORDER_VIEW,
  '/sales-orders/new': [
    PERMISSIONS.SALES_ORDER_CREATE,
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.INVENTORY_VIEW,
  ],
  '/products': PERMISSIONS.PRODUCT_VIEW,
  '/customers': PERMISSIONS.CUSTOMER_VIEW,
  '/inventory': [PERMISSIONS.INVENTORY_VIEW, PERMISSIONS.PRODUCT_VIEW],
  '/payments': [PERMISSIONS.PAYMENT_CREATE, PERMISSIONS.CUSTOMER_VIEW],
  '/reports': PERMISSIONS.REPORT_VIEW,
  '/audit-logs': PERMISSIONS.AUDIT_VIEW,
  '/notifications': PERMISSIONS.NOTIFICATION_VIEW,
  '/team': PERMISSIONS.TEAM_MANAGE,
  '/ai-history': PERMISSIONS.TEAM_MANAGE,
};

export const DEFAULT_AUTHORIZED_PATHS = [
  '/dashboard',
  '/sales-orders',
  '/products',
  '/customers',
  '/inventory',
  '/payments',
  '/reports',
  '/notifications',
  '/audit-logs',
  '/team',
  '/ai-history',
];

export function hasPermission(user: AuthUser | null | undefined, permission: Permission) {
  return Boolean(user?.permissions?.includes(permission));
}

export function hasEveryPermission(
  user: AuthUser | null | undefined,
  permissions: RoutePermission,
) {
  const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];

  return requiredPermissions.every((permission) => hasPermission(user, permission));
}

export function hasAnyPermission(
  user: AuthUser | null | undefined,
  permissions: Permission[],
) {
  return permissions.some((permission) => hasPermission(user, permission));
}

export function canViewOrderFinancials(user: AuthUser | null | undefined) {
  return hasAnyPermission(user, ORDER_FINANCIAL_PERMISSIONS);
}

export function canViewCustomerBalance(user: AuthUser | null | undefined) {
  return hasAnyPermission(user, CUSTOMER_BALANCE_PERMISSIONS);
}

export function canViewProductFinancials(user: AuthUser | null | undefined) {
  return hasAnyPermission(user, PRODUCT_FINANCIAL_PERMISSIONS);
}

export function canAccessPath(user: AuthUser | null | undefined, path: string) {
  const normalizedPath = normalizePath(path);

  if (normalizedPath === NO_WORKSPACE_PATH) {
    return Boolean(user?.accessToken);
  }

  const requiredPermission = ROUTE_PERMISSIONS[normalizedPath];

  // Fail closed: adding a new protected route without declaring its permission
  // must never make that screen available by accident.
  return requiredPermission ? hasEveryPermission(user, requiredPermission) : false;
}

export function firstAuthorizedPath(user: AuthUser | null | undefined) {
  return DEFAULT_AUTHORIZED_PATHS.find((path) => canAccessPath(user, path))
    ?? (user?.accessToken ? NO_WORKSPACE_PATH : '/login');
}

function normalizePath(path: string) {
  if (path.startsWith('/customers/')) {
    return '/customers';
  }

  if (path.startsWith('/sales-orders/new')) {
    return '/sales-orders/new';
  }

  return Object.keys(ROUTE_PERMISSIONS)
    .sort((left, right) => right.length - left.length)
    .find((route) => path === route || path.startsWith(`${route}/`)) ?? path;
}
