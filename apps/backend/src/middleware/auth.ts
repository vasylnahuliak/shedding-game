import type { NextFunction, Request, Response } from 'express';

import { userRepository } from '@/db/repositories/userRepository';
import { resolveAuthIdentity } from '@/services/authIdentity';
import { apiError } from '@/services/messages';
import type { AuthedRequest, RequestWithLocale } from '@/types';

type RequireAuthOptions = {
  requireExistingUser?: boolean;
};

export const requireAuth =
  (options: RequireAuthOptions = {}) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const locale = (req as RequestWithLocale).locale;
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      apiError(res, locale, 401, 'AUTH_MISSING_TOKEN');
      return;
    }

    const token = header.slice('Bearer '.length).trim();
    const identity = await resolveAuthIdentity(token);
    if (!identity) {
      apiError(res, locale, 401, 'AUTH_INVALID_TOKEN');
      return;
    }

    const user = await userRepository.findById(identity.userId);
    const hasProfile = !!user;
    const resolvedLocale = user?.locale ?? locale;
    const userEmail = user?.email ?? identity.email;
    const userRoles = user?.roles ?? [];

    if (options.requireExistingUser !== false && !hasProfile) {
      apiError(res, resolvedLocale, 409, 'AUTH_PROFILE_REQUIRED');
      return;
    }

    (req as AuthedRequest).locale = resolvedLocale;
    (req as AuthedRequest).userId = identity.userId;
    (req as AuthedRequest).userName = user?.name ?? '';
    (req as AuthedRequest).userEmail = userEmail;
    (req as AuthedRequest).hasProfile = hasProfile;
    (req as AuthedRequest).roles = userRoles;

    next();
  };
