export function toNumber(value: string | number | undefined | null) {
  return Number(value ?? 0);
}

export function formatCurrency(value: string | number | undefined | null) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

export function formatNumber(value: string | number | undefined | null) {
  return new Intl.NumberFormat('en-US').format(toNumber(value));
}

export function formatDateTime(value?: string) {
  if (!value) {
    return '--';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatDate(value?: string) {
  if (!value) {
    return '--';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

export function getErrorMessage(error: any) {
  return error?.response?.data?.message || error?.message || 'Something went wrong';
}
