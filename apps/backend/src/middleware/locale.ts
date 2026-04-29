import type { NextFunction, Request, Response } from 'express';

import { resolveAppLocale } from '@shedding-game/shared';

import type { RequestWithLocale } from '@/types';

const getAcceptLanguageHeader = (value: string | string[] | undefined): string | undefined => {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value[0];
  }

  return undefined;
};

export const resolveRequestLocale = (req: Request, _res: Response, next: NextFunction) => {
  const locale = resolveAppLocale(getAcceptLanguageHeader(req.headers['accept-language']));
  (req as RequestWithLocale).locale = locale;
  next();
};
