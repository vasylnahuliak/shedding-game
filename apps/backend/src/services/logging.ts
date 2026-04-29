import type { Request } from 'express';

import type { BackendLogLevel } from './httpErrors';

const REQUEST_ID_HEADER = 'x-request-id';

const getRequestPath = (req: Request): string => {
  const originalUrl = req.originalUrl || req.url;
  const queryIndex = originalUrl.indexOf('?');
  return queryIndex >= 0 ? originalUrl.slice(0, queryIndex) : originalUrl;
};

const getRequestRoute = (req: Request): string => {
  const routePath =
    typeof (req.route as { path?: unknown } | undefined)?.path === 'string'
      ? (req.route as { path?: string }).path
      : null;
  const normalizedRoutePath = typeof routePath === 'string' ? routePath : null;

  if (!normalizedRoutePath) {
    return getRequestPath(req);
  }

  return `${req.baseUrl || ''}${normalizedRoutePath}`;
};

const getLogMethod = (level: BackendLogLevel): 'log' | 'warn' | 'error' => {
  if (level === 'error') {
    return 'error';
  }

  if (level === 'warn') {
    return 'warn';
  }

  return 'log';
};

export const logBackendEvent = (
  level: BackendLogLevel,
  event: string,
  attributes: Record<string, unknown> = {}
): void => {
  const payload = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...attributes,
  });

  console[getLogMethod(level)](payload);
};

export const buildHttpLogContext = (req: Request): Record<string, unknown> => {
  const requestWithUserId = req as unknown as { userId?: unknown; requestId?: string };
  const userId =
    typeof requestWithUserId.userId === 'string' ? requestWithUserId.userId : undefined;

  return {
    requestId:
      typeof req.headers[REQUEST_ID_HEADER] === 'string'
        ? req.headers[REQUEST_ID_HEADER]
        : requestWithUserId.requestId,
    method: req.method,
    route: getRequestRoute(req),
    path: getRequestPath(req),
    userId,
  };
};
