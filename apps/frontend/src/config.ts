type AppEnv = 'local' | 'staging' | 'production';

const requireEnv = (value: string | undefined, name: string): string => {
  if (!value) {
    throw new Error(`${name} environment variable is not defined`);
  }

  return value;
};

const parseAppEnv = (value: string | undefined): AppEnv => {
  if (value === 'staging' || value === 'production' || value === 'local') {
    return value;
  }

  return __DEV__ ? 'local' : 'production';
};

const optionalEnv = (value: string | undefined) => {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : undefined;
};

const trimTrailingSlashes = (value: string): string => value.replace(/\/+$/, '');

const resolveApiUrl = (): string => {
  const explicitApiUrl = optionalEnv(process.env.EXPO_PUBLIC_API_URL);
  if (explicitApiUrl) {
    return explicitApiUrl;
  }

  const appUrl = requireEnv(process.env.EXPO_PUBLIC_APP_URL, 'EXPO_PUBLIC_APP_URL');
  return `${trimTrailingSlashes(appUrl)}/api`;
};

const APP_ENV = parseAppEnv(process.env.EXPO_PUBLIC_APP_ENV);
const APP_URL = requireEnv(process.env.EXPO_PUBLIC_APP_URL, 'EXPO_PUBLIC_APP_URL');
const API_URL = resolveApiUrl();
const APTABASE_APP_KEY = optionalEnv(process.env.EXPO_PUBLIC_APTABASE_APP_KEY);
const SENTRY_DSN_MOBILE = optionalEnv(process.env.EXPO_PUBLIC_SENTRY_DSN_MOBILE);
const SMLER_DOMAIN = optionalEnv(process.env.EXPO_PUBLIC_SMLER_DOMAIN) ?? 'smler.in';
const SUPABASE_URL = requireEnv(process.env.EXPO_PUBLIC_SUPABASE_URL, 'EXPO_PUBLIC_SUPABASE_URL');
const SUPABASE_ANON_KEY = requireEnv(
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  'EXPO_PUBLIC_SUPABASE_ANON_KEY'
);

export {
  API_URL,
  APP_ENV,
  APP_URL,
  APTABASE_APP_KEY,
  SENTRY_DSN_MOBILE,
  SMLER_DOMAIN,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
};
