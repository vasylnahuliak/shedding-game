import type { AppLocale } from './i18n';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './i18n';
import type { Suit } from './types';

export {
  BACKEND_MESSAGE_CODES,
  type BackendMessageCode,
  type BackendMessageParamsByCode,
} from './backendMessageDefinitions';
import type { BackendMessageCode, BackendMessageParamsByCode } from './backendMessageDefinitions';
export { BACKEND_MESSAGE_TEMPLATES } from './backendMessageTemplates';
import { BACKEND_MESSAGE_TEMPLATES } from './backendMessageTemplates';

type InterpolationParams = Record<string, string | number>;

const interpolateTemplate = (template: string, params?: InterpolationParams) => {
  if (!params) return template;

  return template.replace(/{{\s*([^}\s]+)\s*}}/g, (_, key: string) => {
    return String(params[key]);
  });
};

const normalizeLocaleInput = (rawLocale: string | null | undefined): AppLocale | null => {
  if (!rawLocale) return null;

  const directCandidate = rawLocale.trim().toLowerCase().replace('_', '-');
  if (!directCandidate) return null;

  const [localeToken] = directCandidate.includes(',')
    ? directCandidate.split(',')
    : [directCandidate];
  const [languageTag] = localeToken.split(';');

  for (const locale of SUPPORTED_LOCALES) {
    if (locale === languageTag) {
      return locale;
    }
  }

  const languageCode = languageTag.split('-')[0];
  for (const locale of SUPPORTED_LOCALES) {
    if (locale === languageCode) {
      return locale;
    }
  }

  return null;
};

export const resolveAppLocale = (
  rawLocale: string | null | undefined,
  fallbackLocale: AppLocale = DEFAULT_LOCALE
): AppLocale => {
  return normalizeLocaleInput(rawLocale) ?? fallbackLocale;
};

export const getSuitName = (locale: AppLocale, suit: Suit): string => {
  const labels: Record<AppLocale, Record<Suit, string>> = {
    uk: {
      hearts: 'черви',
      diamonds: 'бубни',
      clubs: 'трефи',
      spades: 'піки',
    },
    en: {
      hearts: 'hearts',
      diamonds: 'diamonds',
      clubs: 'clubs',
      spades: 'spades',
    },
  };

  return labels[locale][suit];
};

export const formatBackendMessage = <Code extends BackendMessageCode>(
  locale: AppLocale,
  code: Code,
  params?: Exclude<BackendMessageParamsByCode[Code], undefined>
): string => {
  const templates = BACKEND_MESSAGE_TEMPLATES[locale];
  const template = templates[code];

  return interpolateTemplate(template, params);
};

export type LocalizedMessagePayload<Code extends BackendMessageCode = BackendMessageCode> = {
  code: Code;
  message: string;
  params?: Exclude<BackendMessageParamsByCode[Code], undefined>;
};

export const buildLocalizedMessage = <Code extends BackendMessageCode>(
  locale: AppLocale,
  code: Code,
  params?: Exclude<BackendMessageParamsByCode[Code], undefined>
): LocalizedMessagePayload<Code> => {
  const payload: LocalizedMessagePayload<Code> = {
    code,
    message: formatBackendMessage(locale, code, params),
  };

  if (params !== undefined) {
    payload.params = params;
  }

  return payload;
};
