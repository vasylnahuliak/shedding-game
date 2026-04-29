export const SUPPORTED_LOCALES = ['uk', 'en'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = 'uk';
const SUPPORTED_LOCALE_SET = new Set<string>(SUPPORTED_LOCALES);

export const isAppLocale = (value: unknown): value is AppLocale =>
  typeof value === 'string' && SUPPORTED_LOCALE_SET.has(value);

export const I18N_NAMESPACES = [
  'common',
  'auth',
  'rooms',
  'lobby',
  'game',
  'admin',
  'alerts',
  'errors',
] as const;
export type I18nNamespace = (typeof I18N_NAMESPACES)[number];
