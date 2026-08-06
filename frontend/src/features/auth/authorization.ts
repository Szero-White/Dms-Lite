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
  INVOICE_VIEW: 'INVOICE_VIEW',
  INVOICE_CREATE: 'INVOICE_CREATE',
  INVOICE_ISSUE: 'INVOICE_ISSUE',
  INVOICE_CANCEL: 'INVOICE_CANCEL',
  INVOICE_RECORD_PAYMENT: 'INVOICE_RECORD_PAYMENT',
  INVOICE_DELETE: 'INVOICE_DELETE',
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

const ORDER_FINANCIAL_PERMISSIONS: Permission[] = [
  PERMISSIONS.DEBT_VIEW,
  PERMISSIONS.PAYMENT_CREATE,
  PERMISSIONS.REPORT_VIEW,
  PERMISSIONS.SALES_ORDER_CREATE,
];

export const ROUTE_PERMISSIONS: Record<string, RoutePermission> = {
  '/dashboard': PERMISSIONS.REPORT_VIEW,
  '/sales-orders': PERMISSIONS.SALES_ORDER_VIEW,
  '/sales-orders/new': PERMISSIONS.SALES_ORDER_CREATE,
  '/invoices': PERMISSIONS.INVOICE_VIEW,
  '/invoices/new': PERMISSIONS.INVOICE_CREATE,
  '/products': [PERMISSIONS.PRODUCT_VIEW, PERMISSIONS.INVENTORY_VIEW],
  '/customers': PERMISSIONS.CUSTOMER_VIEW,
  '/inventory': PERMISSIONS.INVENTORY_VIEW,
  '/payments': PERMISSIONS.PAYMENT_CREATE,
  '/reports': PERMISSIONS.REPORT_VIEW,
  '/audit-logs': PERMISSIONS.AUDIT_VIEW,
  '/notifications': PERMISSIONS.NOTIFICATION_VIEW,
  '/team': PERMISSIONS.TEAM_MANAGE,
  '/ai-history': PERMISSIONS.TEAM_MANAGE,
};

export const DEFAULT_AUTHORIZED_PATHS = [
  '/dashboard',
  '/sales-orders',
  '/invoices',
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

export function canAccessPath(user: AuthUser | null | undefined, path: string) {
  const normalizedPath = normalizePath(path);
  const requiredPermission = ROUTE_PERMISSIONS[normalizedPath];

  return requiredPermission ? hasEveryPermission(user, requiredPermission) : true;
}

export function firstAuthorizedPath(user: AuthUser | null | undefined) {
  return DEFAULT_AUTHORIZED_PATHS.find((path) => canAccessPath(user, path)) ?? '/login';
}

function normalizePath(path: string) {
  if (path.startsWith('/customers/')) {
    return '/customers';
  }

  if (path.startsWith('/sales-orders/new')) {
    return '/sales-orders/new';
  }

  if (path.startsWith('/invoices/')) {
    return '/invoices';
  }

  if (path.startsWith('/invoices/new')) {
    return '/invoices/new';
  }

  return Object.keys(ROUTE_PERMISSIONS)
    .sort((left, right) => right.length - left.length)
    .find((route) => path === route || path.startsWith(`${route}/`)) ?? path;
}
