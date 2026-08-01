import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import vi from './locales/vi.json';

export const LANGUAGE_STORAGE_KEY = 'dms-lite-language';

export type SupportedLanguage = 'en' | 'vi';

export const supportedLanguages: SupportedLanguage[] = ['en', 'vi'];

function normalizeLanguage(value: string | null | undefined): SupportedLanguage {
  if (value?.toLowerCase().startsWith('vi')) {
    return 'vi';
  }

  return 'en';
}

export function getStoredLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') {
    return 'en';
  }

  return normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY) ?? navigator.language);
}

void i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      vi: { translation: vi },
    },
    lng: getStoredLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    returnEmptyString: false,
  });

export { i18n };