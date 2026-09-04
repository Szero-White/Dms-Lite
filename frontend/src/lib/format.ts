import { i18n } from '../i18n';

export function toNumber(value: string | number | undefined | null) {
  return Number(value ?? 0);
}

export function formatCurrency(value: string | number | undefined | null, language?: string) {
  return new Intl.NumberFormat(getIntlLocale(language), {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

export function getIntlLocale(language = i18n.language) {
  return language?.toLowerCase().startsWith('vi') ? 'vi-VN' : 'en-US';
}

export function formatNumber(value: string | number | undefined | null, language?: string) {
  return new Intl.NumberFormat(getIntlLocale(language)).format(toNumber(value));
}

export function formatDateTime(value?: string, language?: string) {
  if (!value) {
    return '--';
  }

  return new Intl.DateTimeFormat(getIntlLocale(language), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatDate(value?: string, language?: string) {
  if (!value) {
    return '--';
  }

  return new Intl.DateTimeFormat(getIntlLocale(language), {
    dateStyle: 'medium',
  }).format(new Date(value));
}

const SERVER_ERROR_KEYS: Record<string, string> = {
  'AI history item not found': 'errors.api.aiHistoryNotFound',
  'Amount is required': 'errors.api.amountRequired',
  'Amount must be greater than zero': 'errors.api.amountPositive',
  'At least one permission is required': 'errors.api.permissionRequired',
  'At least one role is required': 'errors.api.roleRequired',
  'Bad credentials': 'errors.api.badCredentials',
  'Cannot delete customer with outstanding debt': 'errors.api.customerOutstandingDebt',
  'Conversation content must be 1200 characters or less': 'errors.api.conversationContentLength',
  'Conversation context must contain 8 turns or less': 'errors.api.conversationContextLength',
  'Conversation role must be 16 characters or less': 'errors.api.conversationRoleLength',
  'Cost price must be zero or positive': 'errors.api.costPriceNonNegative',
  'Credit limit must be zero or positive': 'errors.api.creditLimitNonNegative',
  'Current user not found': 'errors.api.currentUserNotFound',
  'Custom role not found': 'errors.api.customRoleNotFound',
  'Customer id must be positive': 'errors.api.customerIdPositive',
  'Customer is required': 'errors.api.customerRequired',
  'Customer not found': 'errors.api.customerNotFound',
  'Demo accounts are protected while demo mode is enabled': 'errors.api.demoAccountProtected',
  'Discount amount must be zero or positive': 'errors.api.discountNonNegative',
  'Discount exceeds line amount': 'errors.api.discountExceedsLine',
  'Internal server error': 'errors.api.serverError',
  'Locale must be 16 characters or less': 'errors.api.localeLength',
  'Minimum stock must be zero or positive': 'errors.api.minimumStockNonNegative',
  'Notification not found': 'errors.api.notificationNotFound',
  'One or more products were not found': 'errors.api.productsNotFound',
  'Only DRAFT can be cancelled': 'errors.api.onlyDraftCancelled',
  'Only DRAFT can be confirmed': 'errors.api.onlyDraftConfirmed',
  'Only visible staff roles can be assigned from Team Management': 'errors.api.visibleStaffRolesOnly',
  'Order not found': 'errors.api.orderNotFound',
  'Owner access cannot be changed from Team Management': 'errors.api.ownerAccessProtected',
  'Paid exceeds total': 'errors.api.paidExceedsTotal',
  'Password must be at least 8 characters': 'errors.api.passwordLength',
  'Payment exceeds debt': 'errors.api.paymentExceedsDebt',
  'Payment term days must be zero or positive': 'errors.api.paymentTermNonNegative',
  'Product id must be positive': 'errors.api.productIdPositive',
  'Product is required': 'errors.api.productRequired',
  'Product not found': 'errors.api.productNotFound',
  'Question must be 500 characters or less': 'errors.api.questionLength',
  'Quantity is required': 'errors.api.quantityRequired',
  'Quantity must be greater than zero': 'errors.api.quantityPositive',
  'Role is assigned to team members': 'errors.api.roleAssigned',
  'Role name already exists': 'errors.api.roleNameExists',
  'Role name is required': 'errors.api.roleNameRequired',
  'Role name must be 100 characters or less': 'errors.api.roleNameLength',
  'Sales order for receivable not found': 'errors.api.receivableOrderNotFound',
  'Sales order items must not be empty': 'errors.api.salesOrderItemsRequired',
  'Selling price must be zero or positive': 'errors.api.sellingPriceNonNegative',
  'SKU already exists': 'errors.api.skuExists',
  'System role names are reserved': 'errors.api.systemRoleNameReserved',
  'System roles cannot be changed': 'errors.api.systemRoleProtected',
  'Team management permission is reserved for Owner accounts': 'errors.api.teamPermissionOwnerOnly',
  'Team member not found': 'errors.api.teamMemberNotFound',
  'Too many AI questions. Please wait a moment before asking again.': 'errors.api.aiRateLimit',
  'Unknown permission selected': 'errors.api.unknownPermission',
  'Username already exists': 'errors.api.usernameExists',
  'Validation failed': 'errors.api.validationFailed',
  'Warehouse id must be positive': 'errors.api.warehouseIdPositive',
  'Warehouse is not configured': 'errors.api.warehouseNotConfigured',
  'Warehouse is required': 'errors.api.warehouseRequired',
  'Warehouse not found': 'errors.api.warehouseNotFound',
  'You cannot change your own access from Team Management': 'errors.api.selfAccessProtected',
  'You do not have permission to perform this action': 'errors.api.permissionDenied',
  'must not be blank': 'errors.api.requiredField',
  'must not be empty': 'errors.api.requiredField',
  'must not be null': 'errors.api.requiredField',
};

function permissionLabel(permission: string) {
  return i18n.t(`permissions.${permission}.label`, { defaultValue: i18n.t('permissions.unknown.label') });
}

function localizeKnownServerMessage(message: string): string | null {
  const normalized = message.trim();
  if (!normalized) {
    return null;
  }

  const exactKey = SERVER_ERROR_KEYS[normalized];
  if (exactKey) {
    return i18n.t(exactKey);
  }

  let match = normalized.match(/^Product not found: (\d+)$/);
  if (match) {
    return i18n.t('errors.api.productNotFoundWithId', { id: match[1] });
  }

  match = normalized.match(/^Product (\d+) has not been stocked in warehouse (\d+)$/);
  if (match) {
    return i18n.t('errors.api.productNotStocked', {
      productId: match[1],
      warehouseId: match[2],
    });
  }

  match = normalized.match(/^Insufficient stock for product (\d+)\. Available: (\d+), required: (\d+)$/);
  if (match) {
    return i18n.t('errors.api.insufficientStock', {
      productId: match[1],
      available: match[2],
      required: match[3],
    });
  }

  match = normalized.match(/^([A-Z0-9_]+) requires: \[(.*)]$/);
  if (match) {
    const dependencies = match[2]
      .split(',')
      .map((permission) => permission.trim())
      .filter(Boolean)
      .map(permissionLabel)
      .join(', ');

    return i18n.t('errors.api.permissionDependencies', {
      permission: permissionLabel(match[1]),
      dependencies,
    });
  }

  // ConstraintViolationException can prefix a field or method path, for example
  // "create.arg0.name: must not be blank". Localize the useful suffix only.
  const separatorIndex = normalized.lastIndexOf(':');
  if (separatorIndex >= 0) {
    const suffix = normalized.slice(separatorIndex + 1).trim();
    if (suffix && suffix !== normalized) {
      const localizedSuffix = localizeKnownServerMessage(suffix);
      if (localizedSuffix) {
        return localizedSuffix;
      }
    }
  }

  return null;
}

export function getErrorMessage(error: any, fallback = i18n.t('common.somethingWentWrong')) {
  const serverMessage = typeof error?.response?.data?.message === 'string'
    ? error.response.data.message
    : '';
  const localizedServerMessage = serverMessage
    ? localizeKnownServerMessage(serverMessage)
    : null;

  if (localizedServerMessage) {
    return localizedServerMessage;
  }

  const status = Number(error?.response?.status ?? 0);
  if (status === 400) {
    return i18n.t('errors.api.requestInvalid');
  }
  if (status === 401) {
    return i18n.t('errors.api.unauthorized');
  }
  if (status === 403) {
    return i18n.t('errors.api.permissionDenied');
  }
  if (status === 404) {
    return i18n.t('errors.api.notFound');
  }
  if (status === 409) {
    return i18n.t('errors.api.conflict');
  }
  if (status === 429) {
    return i18n.t('errors.api.tooManyRequests');
  }
  if (status >= 500) {
    return i18n.t('errors.api.serverError');
  }

  const message = typeof error?.message === 'string' ? error.message : '';
  if (/timeout|ECONNABORTED/i.test(message) || error?.code === 'ECONNABORTED') {
    return i18n.t('errors.api.timeout');
  }
  if (/network error|failed to fetch/i.test(message) || (!error?.response && error?.request)) {
    return i18n.t('errors.api.network');
  }

  // Do not leak an arbitrary server/library English sentence into a Vietnamese UI.
  // Unknown failures use a stable localized fallback; technical detail remains in dev tools.
  if (serverMessage || /^Request failed with status code/i.test(message)) {
    return i18n.t('errors.api.requestFailed');
  }

  return fallback;
}
