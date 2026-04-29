import type { BackendMessageCode, BackendMessageParamsByCode } from '@shedding-game/shared';
import type { Response } from 'express';

type HttpErrorShape = Error & {
  status?: number | string;
  statusCode?: number | string;
  status_code?: number | string;
  output?: {
    statusCode?: number | string;
  };
  reportToSentry?: boolean;
};

type MessageParams<Code extends BackendMessageCode> = Exclude<
  BackendMessageParamsByCode[Code],
  undefined
>;

export type BackendLogLevel = 'info' | 'warn' | 'error';

type ExpectedHttpErrorResponseMetadata = {
  statusCode: number;
  code?: BackendMessageCode;
  logLevel: Exclude<BackendLogLevel, 'error'>;
  reason?: string;
};

type ExpectedHttpErrorOptions = {
  logLevel?: Exclude<BackendLogLevel, 'error'>;
  reason?: string;
  reportToSentry?: boolean;
  cause?: unknown;
};

const EXPECTED_HTTP_ERROR_LOCALS_KEY = '__expectedHttpError';

const parseHttpStatusCode = (value: number | string | undefined): number | null => {
  if (value === undefined) {
    return null;
  }

  const parsedValue = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsedValue) || parsedValue < 400 || parsedValue > 599) {
    return null;
  }

  return parsedValue;
};

export const getHttpErrorStatusCode = (error: unknown): number | null => {
  if (!(error instanceof Error)) {
    return null;
  }

  const httpError = error as HttpErrorShape;

  return (
    parseHttpStatusCode(httpError.status) ??
    parseHttpStatusCode(httpError.statusCode) ??
    parseHttpStatusCode(httpError.status_code) ??
    parseHttpStatusCode(httpError.output?.statusCode)
  );
};

export const getDefaultHandledHttpLogLevel = (
  statusCode: number
): Exclude<BackendLogLevel, 'error'> =>
  statusCode === 401 || statusCode === 403 || statusCode === 429 ? 'warn' : 'info';

class ExpectedHttpError<Code extends BackendMessageCode = BackendMessageCode> extends Error {
  readonly statusCode: number;
  readonly code: Code;
  readonly params?: MessageParams<Code>;
  readonly logLevel: Exclude<BackendLogLevel, 'error'>;
  readonly reason?: string;
  readonly reportToSentry: boolean;

  constructor(
    statusCode: number,
    code: Code,
    params?: MessageParams<Code>,
    options: ExpectedHttpErrorOptions = {}
  ) {
    super(options.reason ?? code);

    this.name = 'ExpectedHttpError';
    this.statusCode = statusCode;
    this.code = code;
    this.params = params;
    this.logLevel = options.logLevel ?? getDefaultHandledHttpLogLevel(statusCode);
    this.reason = options.reason;
    this.reportToSentry = options.reportToSentry ?? false;

    if (options.cause !== undefined) {
      (this as { cause?: unknown }).cause = options.cause;
    }
  }
}

export const expectedHttpError = <Code extends BackendMessageCode>(
  statusCode: number,
  code: Code,
  params?: MessageParams<Code>,
  options?: ExpectedHttpErrorOptions
): ExpectedHttpError<Code> => new ExpectedHttpError(statusCode, code, params, options);

export const isExpectedHttpError = (error: unknown): error is ExpectedHttpError =>
  error instanceof ExpectedHttpError;

export const shouldReportExceptionToSentry = (error: unknown): boolean => {
  if (isExpectedHttpError(error)) {
    return error.reportToSentry;
  }

  if (error instanceof Error) {
    const httpError = error as HttpErrorShape;

    if (typeof httpError.reportToSentry === 'boolean') {
      return httpError.reportToSentry;
    }
  }

  const statusCode = getHttpErrorStatusCode(error);
  return statusCode === null || statusCode >= 500;
};

export const setExpectedHttpErrorMetadata = (
  res: Response,
  metadata: ExpectedHttpErrorResponseMetadata
): void => {
  res.locals[EXPECTED_HTTP_ERROR_LOCALS_KEY] = metadata;
};

export const clearExpectedHttpErrorMetadata = (res: Response): void => {
  delete res.locals[EXPECTED_HTTP_ERROR_LOCALS_KEY];
};

export const getExpectedHttpErrorMetadata = (
  res: Response
): ExpectedHttpErrorResponseMetadata | null => {
  const metadata = (res.locals as Record<string, unknown>)[EXPECTED_HTTP_ERROR_LOCALS_KEY];
  return metadata && typeof metadata === 'object'
    ? (metadata as ExpectedHttpErrorResponseMetadata)
    : null;
};
