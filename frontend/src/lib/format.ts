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

export function getErrorMessage(error: any, fallback = i18n.t('common.somethingWentWrong')) {
  const serverMessage = error?.response?.data?.message;
  if (serverMessage) {
    return serverMessage;
  }

  const message = error?.message;
  if (message && !/^Request failed with status code/.test(message)) {
    return message;
  }

  return fallback;
}
