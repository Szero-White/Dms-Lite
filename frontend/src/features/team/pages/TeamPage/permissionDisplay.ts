import type { TFunction } from 'i18next';
import type { PermissionOption } from '../../types/team.types';

interface PermissionDisplay {
  groupKey: string;
  labelKey: string;
  descriptionKey: string;
}

const PERMISSION_DISPLAY: Record<string, PermissionDisplay> = {
  AI_HELP_VIEW: {
    groupKey: 'permissions.group.workspace',
    labelKey: 'permissions.AI_HELP_VIEW.label',
    descriptionKey: 'permissions.AI_HELP_VIEW.description',
  },
  AUDIT_VIEW: {
    groupKey: 'permissions.group.administration',
    labelKey: 'permissions.AUDIT_VIEW.label',
    descriptionKey: 'permissions.AUDIT_VIEW.description',
  },
  CUSTOMER_MANAGE: {
    groupKey: 'permissions.group.customers',
    labelKey: 'permissions.CUSTOMER_MANAGE.label',
    descriptionKey: 'permissions.CUSTOMER_MANAGE.description',
  },
  CUSTOMER_VIEW: {
    groupKey: 'permissions.group.customers',
    labelKey: 'permissions.CUSTOMER_VIEW.label',
    descriptionKey: 'permissions.CUSTOMER_VIEW.description',
  },
  DEBT_VIEW: {
    groupKey: 'permissions.group.finance',
    labelKey: 'permissions.DEBT_VIEW.label',
    descriptionKey: 'permissions.DEBT_VIEW.description',
  },
  INVOICE_VIEW: {
    groupKey: 'permissions.group.finance',
    labelKey: 'permissions.INVOICE_VIEW.label',
    descriptionKey: 'permissions.INVOICE_VIEW.description',
  },
  INVOICE_CREATE: {
    groupKey: 'permissions.group.finance',
    labelKey: 'permissions.INVOICE_CREATE.label',
    descriptionKey: 'permissions.INVOICE_CREATE.description',
  },
  INVOICE_ISSUE: {
    groupKey: 'permissions.group.finance',
    labelKey: 'permissions.INVOICE_ISSUE.label',
    descriptionKey: 'permissions.INVOICE_ISSUE.description',
  },
  INVOICE_CANCEL: {
    groupKey: 'permissions.group.finance',
    labelKey: 'permissions.INVOICE_CANCEL.label',
    descriptionKey: 'permissions.INVOICE_CANCEL.description',
  },
  INVENTORY_MANAGE: {
    groupKey: 'permissions.group.inventory',
    labelKey: 'permissions.INVENTORY_MANAGE.label',
    descriptionKey: 'permissions.INVENTORY_MANAGE.description',
  },
  INVENTORY_VIEW: {
    groupKey: 'permissions.group.inventory',
    labelKey: 'permissions.INVENTORY_VIEW.label',
    descriptionKey: 'permissions.INVENTORY_VIEW.description',
  },
  NOTIFICATION_VIEW: {
    groupKey: 'permissions.group.workspace',
    labelKey: 'permissions.NOTIFICATION_VIEW.label',
    descriptionKey: 'permissions.NOTIFICATION_VIEW.description',
  },
  PAYMENT_CREATE: {
    groupKey: 'permissions.group.finance',
    labelKey: 'permissions.PAYMENT_CREATE.label',
    descriptionKey: 'permissions.PAYMENT_CREATE.description',
  },
  PRODUCT_MANAGE: {
    groupKey: 'permissions.group.catalog',
    labelKey: 'permissions.PRODUCT_MANAGE.label',
    descriptionKey: 'permissions.PRODUCT_MANAGE.description',
  },
  PRODUCT_VIEW: {
    groupKey: 'permissions.group.catalog',
    labelKey: 'permissions.PRODUCT_VIEW.label',
    descriptionKey: 'permissions.PRODUCT_VIEW.description',
  },
  REPORT_VIEW: {
    groupKey: 'permissions.group.insights',
    labelKey: 'permissions.REPORT_VIEW.label',
    descriptionKey: 'permissions.REPORT_VIEW.description',
  },
  SALES_ORDER_CANCEL: {
    groupKey: 'permissions.group.sales',
    labelKey: 'permissions.SALES_ORDER_CANCEL.label',
    descriptionKey: 'permissions.SALES_ORDER_CANCEL.description',
  },
  SALES_ORDER_CONFIRM: {
    groupKey: 'permissions.group.sales',
    labelKey: 'permissions.SALES_ORDER_CONFIRM.label',
    descriptionKey: 'permissions.SALES_ORDER_CONFIRM.description',
  },
  SALES_ORDER_CREATE: {
    groupKey: 'permissions.group.sales',
    labelKey: 'permissions.SALES_ORDER_CREATE.label',
    descriptionKey: 'permissions.SALES_ORDER_CREATE.description',
  },
  SALES_ORDER_VIEW: {
    groupKey: 'permissions.group.sales',
    labelKey: 'permissions.SALES_ORDER_VIEW.label',
    descriptionKey: 'permissions.SALES_ORDER_VIEW.description',
  },
  TEAM_MANAGE: {
    groupKey: 'permissions.group.administration',
    labelKey: 'permissions.TEAM_MANAGE.label',
    descriptionKey: 'permissions.TEAM_MANAGE.description',
  },
};

const GROUP_KEYS: Record<string, string> = {
  Administration: 'permissions.group.administration',
  Catalog: 'permissions.group.catalog',
  Customers: 'permissions.group.customers',
  Finance: 'permissions.group.finance',
  Insights: 'permissions.group.insights',
  Inventory: 'permissions.group.inventory',
  Sales: 'permissions.group.sales',
  Workspace: 'permissions.group.workspace',
};

export function permissionLabel(permission: string, t: TFunction) {
  const display = PERMISSION_DISPLAY[permission];

  return display ? t(display.labelKey) : t('permissions.unknown.label');
}

export function permissionDescription(permission: PermissionOption, t: TFunction) {
  const display = PERMISSION_DISPLAY[permission.name];

  return display ? t(display.descriptionKey) : t('permissions.unknown.description');
}

export function permissionGroupLabel(group: string, t: TFunction) {
  const groupKey = GROUP_KEYS[group];

  return groupKey ? t(groupKey) : t('permissions.group.other');
}
