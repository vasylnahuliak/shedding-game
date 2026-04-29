import { initReactI18next } from 'react-i18next';

import { getLocales } from 'expo-localization';
import { createInstance, type i18n as I18nType } from 'i18next';

import {
  DEFAULT_LOCALE,
  I18N_NAMESPACES,
  resolveAppLocale,
  SUPPORTED_LOCALES,
} from '@shedding-game/shared';

import en from './locales/en';
import uk from './locales/uk';

import './polyfills';
export { formatDateTime, formatDuration } from './formatters';
export { useAppTranslation } from './useAppTranslation';

const resources = {
  uk,
  en,
} as const;

const i18n: I18nType = createInstance();
const getDefaultLanguage = () => {
  const locales = getLocales();
  const primary = locales[0];

  return resolveAppLocale(primary?.languageTag ?? primary?.languageCode ?? null, DEFAULT_LOCALE);
};

const initI18n = async (): Promise<I18nType> => {
  if (i18n.isInitialized) {
    return i18n;
  }

  await i18n.use(initReactI18next).init({
    resources,
    lng: getDefaultLanguage(),
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: [...SUPPORTED_LOCALES],
    ns: [...I18N_NAMESPACES],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  });

  return i18n;
};

void initI18n();

export default i18n;
