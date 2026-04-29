import type { NextFunction, Request, Response } from 'express';

import { type AppRole, hasAnyRole } from '@shedding-game/shared';

import { apiError } from '@/services/messages';
import type { AuthedRequest } from '@/types';

export const requireRole =
  (...requiredRoles: AppRole[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const authedReq = req as AuthedRequest;
    const hasRequiredRole = hasAnyRole(authedReq.roles ?? [], requiredRoles);

    if (hasRequiredRole) {
      next();
      return;
    }

    apiError(res, authedReq.locale, 403, 'ROOM_ACCESS_DENIED');
  };
