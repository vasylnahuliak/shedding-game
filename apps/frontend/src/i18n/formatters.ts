import type { AppLocale } from '@shedding-game/shared';

import { resolveAppLocale } from '@shedding-game/shared';

const LOCALE_MAP: Record<AppLocale, string> = {
  uk: 'uk-UA',
  en: 'en-US',
};

const normalizeLocale = (locale: AppLocale | string): AppLocale => resolveAppLocale(locale);

const toIntlLocale = (locale: AppLocale | string) => {
  return LOCALE_MAP[normalizeLocale(locale)] ?? 'uk-UA';
};

export const formatDateTime = (locale: AppLocale | string, timestamp: number) => {
  const dateTimeFormat = Intl?.DateTimeFormat;
  if (typeof dateTimeFormat !== 'function') {
    return new Date(timestamp).toLocaleString();
  }

  return new dateTimeFormat(toIntlLocale(locale), {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(timestamp));
};

export const formatDuration = (locale: AppLocale | string, totalSeconds: number) => {
  const durationSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  const normalizedLocale = normalizeLocale(locale);

  if (normalizedLocale === 'uk') {
    if (minutes > 0) {
      return `${minutes} хв ${seconds} с`;
    }
    return `${seconds} с`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};
