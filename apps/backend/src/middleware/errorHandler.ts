import type { NextFunction, Request, Response } from 'express';

import { DEFAULT_LOCALE } from '@shedding-game/shared';

import { getHttpErrorStatusCode, isExpectedHttpError } from '@/services/httpErrors';
import { apiError } from '@/services/messages';
import type { RequestWithLocale } from '@/types';

const getErrorMessage = (error: unknown, statusCode: number): string => {
  if (statusCode >= 500) {
    return 'Internal server error';
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return 'Request failed';
};

export const handleApiError = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (isExpectedHttpError(error)) {
    apiError(
      res,
      (req as RequestWithLocale).locale ?? DEFAULT_LOCALE,
      error.statusCode,
      error.code,
      error.params
    );
    return;
  }

  const statusCode = getHttpErrorStatusCode(error) ?? 500;
  if (statusCode >= 500) {
    console.error('Unhandled request error:', error);
  }

  res.status(statusCode).json({
    message: getErrorMessage(error, statusCode),
  });
};
