import * as Sentry from '@sentry/react-native';

import { isSentryEnabled } from '@/monitoring/sentry';

interface ApiErrorContext {
  url?: string;
  method?: string;
  status?: number;
  responseBody?: unknown;
}

interface CaptureErrorOptions {
  kind: 'api' | 'component' | 'error';
  message: string;
  context?: object;
}

const toError = (error: unknown) => (error instanceof Error ? error : new Error(String(error)));

class LoggingServiceClass {
  debug(message: string, context?: object) {
    if (__DEV__) {
      console.log(`[DEBUG] ${message}`, context ?? '');
    }
  }

  info(message: string, context?: object) {
    console.info(`[INFO] ${message}`, context ?? '');
  }

  warn(message: string, context?: object) {
    console.warn(`[WARN] ${message}`, context ?? '');
  }

  error(message: string, error?: unknown, context?: object) {
    const err = toError(error);
    console.error(`[ERROR] ${message}`, { error: err.message, stack: err.stack, ...context });
    this.captureError(err, { kind: 'error', message, context });
  }

  apiError(message: string, error: unknown, context: ApiErrorContext) {
    const err = toError(error);
    console.error(`[API ERROR] ${message}`, {
      ...context,
      error: err.message,
    });
    this.captureError(err, { kind: 'api', message, context });
  }

  componentError(error: Error, componentStack?: string) {
    console.error('[COMPONENT ERROR]', { error: error.message, componentStack });
    this.captureError(error, {
      kind: 'component',
      message: 'Component render error',
      context: componentStack ? { componentStack } : undefined,
    });
  }

  setUser(user: { id: string; username?: string } | null) {
    if (__DEV__) {
      console.log('[USER CONTEXT]', user);
    }

    if (!isSentryEnabled()) {
      return;
    }

    Sentry.setUser(user ? { id: user.id, username: user.username } : null);
  }

  private captureError(error: Error, { kind, message, context }: CaptureErrorOptions) {
    if (!isSentryEnabled()) {
      return;
    }

    Sentry.withScope((scope) => {
      scope.setTag('error_kind', kind);
      scope.setExtra('log_message', message);

      if (context) {
        scope.setContext('details', context as Record<string, unknown>);
      }

      Sentry.captureException(error);
    });
  }
}

export const LoggingService = new LoggingServiceClass();
