import * as Sentry from '@sentry/node';

import { shouldReportExceptionToSentry } from './httpErrors';

export const captureBackendException = (
  error: unknown,
  captureContext?: Parameters<typeof Sentry.captureException>[1]
): string | undefined => {
  if (!Sentry.isInitialized() || !shouldReportExceptionToSentry(error)) {
    return undefined;
  }

  return Sentry.captureException(error, captureContext);
};

export const flushBackendTelemetry = async (timeoutMs = 2_000): Promise<boolean> => {
  if (!Sentry.isInitialized()) {
    return true;
  }

  return Sentry.flush(timeoutMs);
};
