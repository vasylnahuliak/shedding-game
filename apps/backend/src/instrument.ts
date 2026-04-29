import * as Sentry from '@sentry/node';
import fs from 'fs';
import path from 'path';

import { getAppEnv, loadBackendEnvFiles } from '@/env';
import { shouldReportExceptionToSentry } from '@/services/httpErrors';

loadBackendEnvFiles();
const appEnv = getAppEnv();

const normalizeEnvValue = (value: string | undefined): string | undefined => {
  const normalizedValue = value?.trim();
  return normalizedValue ? normalizedValue : undefined;
};

const parseSampleRate = (value: string | undefined): number | undefined => {
  const normalizedValue = normalizeEnvValue(value);
  if (!normalizedValue) {
    return undefined;
  }

  const parsedValue = Number(normalizedValue);
  if (!Number.isFinite(parsedValue) || parsedValue < 0 || parsedValue > 1) {
    console.warn(
      `Ignoring invalid SENTRY_TRACES_SAMPLE_RATE="${normalizedValue}". Expected a number between 0 and 1.`
    );
    return undefined;
  }

  return parsedValue;
};

const getBackendRelease = (): string | undefined => {
  const packageJsonPath = path.resolve(__dirname, '..', 'package.json');

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
      name?: unknown;
      version?: unknown;
    };

    const packageName =
      typeof packageJson.name === 'string' && packageJson.name.trim().length > 0
        ? packageJson.name.trim()
        : null;
    const packageVersion =
      typeof packageJson.version === 'string' && packageJson.version.trim().length > 0
        ? packageJson.version.trim()
        : null;

    if (!packageName || !packageVersion) {
      return undefined;
    }

    return `${packageName}@${packageVersion}`;
  } catch (error) {
    console.warn('Failed to resolve backend release from package.json:', error);
    return undefined;
  }
};

const sentryDsn = normalizeEnvValue(process.env.SENTRY_DSN);

if (appEnv === 'local') {
  if (sentryDsn) {
    console.warn('Sentry is disabled when APP_ENV=local. Ignoring SENTRY_DSN.');
  }
} else {
  if (!sentryDsn) {
    throw new Error(`SENTRY_DSN is required when APP_ENV=${appEnv}.`);
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: normalizeEnvValue(process.env.SENTRY_ENVIRONMENT) ?? appEnv,
    release: getBackendRelease(),
    tracesSampleRate: parseSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE),
    beforeSend(event, hint) {
      if (!shouldReportExceptionToSentry(hint.originalException)) {
        return null;
      }

      return event;
    },
  });
}
