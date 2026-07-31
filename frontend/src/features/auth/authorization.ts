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
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  '/dashboard': PERMISSIONS.REPORT_VIEW,
  '/sales-orders': PERMISSIONS.SALES_ORDER_VIEW,
  '/sales-orders/new': PERMISSIONS.SALES_ORDER_CREATE,
  '/products': PERMISSIONS.PRODUCT_VIEW,
  '/customers': PERMISSIONS.CUSTOMER_VIEW,
  '/inventory': PERMISSIONS.INVENTORY_VIEW,
  '/payments': PERMISSIONS.PAYMENT_CREATE,
  '/reports': PERMISSIONS.REPORT_VIEW,
  '/audit-logs': PERMISSIONS.AUDIT_VIEW,
  '/notifications': PERMISSIONS.NOTIFICATION_VIEW,
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
];

export function hasPermission(user: AuthUser | null | undefined, permission: Permission) {
  return Boolean(user?.permissions?.includes(permission));
}

export function canAccessPath(user: AuthUser | null | undefined, path: string) {
  const normalizedPath = normalizePath(path);
  const requiredPermission = ROUTE_PERMISSIONS[normalizedPath];

  return requiredPermission ? hasPermission(user, requiredPermission) : true;
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

  return Object.keys(ROUTE_PERMISSIONS)
    .sort((left, right) => right.length - left.length)
    .find((route) => path === route || path.startsWith(`${route}/`)) ?? path;
}
