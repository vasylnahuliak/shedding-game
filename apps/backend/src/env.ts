import { parse as parseDotenv } from 'dotenv';
import fs from 'fs';
import path from 'path';

type AppEnv = 'local' | 'staging' | 'production';

const BASE_ENV_FILE = '.env';
const LEGACY_LOCAL_ENV_FILE = '.env.development';

let loaded = false;

const readEnvFile = (filePath: string): Record<string, string> => {
  try {
    return parseDotenv(fs.readFileSync(filePath));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {};
    }
    throw error;
  }
};

const normalizeAppEnv = (value: string | undefined, fallback: AppEnv): AppEnv => {
  const normalizedValue = value?.trim().toLowerCase();
  if (normalizedValue === undefined) {
    return fallback;
  }

  switch (normalizedValue) {
    case 'local':
    case 'development':
    case 'dev':
      return 'local';
    case 'staging':
      return 'staging';
    case 'production':
    case 'prod':
      return 'production';
    default:
      return fallback;
  }
};

const resolveAppEnv = (): AppEnv => {
  const filePath = path.resolve(process.cwd(), BASE_ENV_FILE);
  const baseEnv = readEnvFile(filePath);
  const fallbackAppEnv =
    process.env.NODE_ENV === 'production' || baseEnv.NODE_ENV?.trim().toLowerCase() === 'production'
      ? 'production'
      : 'local';
  const appEnv = normalizeAppEnv(process.env.APP_ENV ?? baseEnv.APP_ENV, fallbackAppEnv);
  process.env.APP_ENV = appEnv;
  return appEnv;
};

const resolveEnvFiles = (appEnv: AppEnv): string[] => {
  const envFiles = [BASE_ENV_FILE];

  if (appEnv === 'local') {
    envFiles.push('.env.local', LEGACY_LOCAL_ENV_FILE);
    return envFiles;
  }

  envFiles.push(`.env.${appEnv}`, `.env.${appEnv}.local`);
  return envFiles;
};

export const getAppEnv = (): AppEnv => resolveAppEnv();

export const loadBackendEnvFiles = (): void => {
  if (loaded) return;
  loaded = true;

  const initialEnvKeys = new Set(Object.keys(process.env));
  const envFiles = resolveEnvFiles(resolveAppEnv());

  for (const fileName of envFiles) {
    const filePath = path.resolve(process.cwd(), fileName);
    const parsed = readEnvFile(filePath);

    for (const [key, value] of Object.entries(parsed)) {
      if (initialEnvKeys.has(key)) continue;
      process.env[key] = value;
    }
  }
};
