import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';

import { getDefaultHandledHttpLogLevel, getExpectedHttpErrorMetadata } from '@/services/httpErrors';
import { buildHttpLogContext, logBackendEvent } from '@/services/logging';
import type { RequestWithRequestId } from '@/types';

const REQUEST_ID_HEADER = 'x-request-id';

const getIncomingRequestId = (req: Request): string | null => {
  const headerValue = req.header(REQUEST_ID_HEADER)?.trim();
  return headerValue ? headerValue.slice(0, 128) : null;
};

export const attachRequestContext = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = getIncomingRequestId(req) ?? crypto.randomUUID();

  (req as RequestWithRequestId).requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);

  res.on('finish', () => {
    if (res.statusCode < 400 || res.statusCode >= 500) {
      return;
    }

    const metadata = getExpectedHttpErrorMetadata(res);

    logBackendEvent(
      metadata?.logLevel ?? getDefaultHandledHttpLogLevel(res.statusCode),
      metadata?.code ? 'http.expected_error' : 'http.client_error',
      {
        ...buildHttpLogContext(req),
        statusCode: res.statusCode,
        errorCode: metadata?.code,
        reason: metadata?.reason,
      }
    );
  });

  next();
};
