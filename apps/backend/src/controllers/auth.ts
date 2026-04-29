import type { Request, Response } from 'express';

import {
  safeParseWithSchema,
  UpdateDiscardPilePreferenceBodySchema,
  UpdateEmojiPreferenceBodySchema,
  UpdateHapticsPreferenceBodySchema,
  UpdateLocaleBodySchema,
  UpsertProfileBodySchema,
} from '@shedding-game/shared';

import { isDisplayNameConflictError } from '@/db/prismaErrors';
import { userRepository } from '@/db/repositories/userRepository';
import { deleteAccount as deleteAccountService } from '@/services/accountDeletion';
import { sanitizeUser } from '@/services/auth';
import { expectedHttpError } from '@/services/httpErrors';
import { apiError } from '@/services/messages';
import { captureBackendException } from '@/services/sentry';
import type { AuthedRequest } from '@/types';

const getValidatedBodyOutput = <TOutput>(
  authedReq: AuthedRequest,
  res: Response,
  result: { success: true; output: TOutput } | { success: false },
  invalidCode:
    | 'AUTH_INVALID_REACTION_TYPE'
    | 'AUTH_INVALID_LOCALE'
    | 'AUTH_INVALID_HAPTICS_ENABLED'
    | 'AUTH_INVALID_DISCARD_PILE_PREFERENCE'
): TOutput | null => {
  if (!result.success) {
    apiError(res, authedReq.locale, 400, invalidCode);
    return null;
  }

  return result.output;
};

const respondWithSanitizedUser = (
  authedReq: AuthedRequest,
  res: Response,
  user: Awaited<ReturnType<typeof userRepository.findById>>
) => {
  if (!user) {
    apiError(res, authedReq.locale, 401, 'AUTH_USER_NOT_FOUND');
    return false;
  }

  res.json({ user: sanitizeUser(user) });
  return true;
};

export const upsertProfile = async (req: Request, res: Response) => {
  const authedReq = req as AuthedRequest;

  const bodyResult = safeParseWithSchema(UpsertProfileBodySchema, req.body);
  if (!bodyResult.success) {
    apiError(res, authedReq.locale, 400, 'AUTH_DISPLAY_NAME_REQUIRED');
    return;
  }

  const displayName = bodyResult.output.displayName;
  if (!displayName) {
    apiError(res, authedReq.locale, 400, 'AUTH_DISPLAY_NAME_REQUIRED');
    return;
  }

  try {
    const user = await userRepository.upsertSupabaseProfile({
      id: authedReq.userId,
      email: authedReq.userEmail,
      displayName,
      locale: authedReq.locale,
    });

    if (!user) {
      apiError(res, authedReq.locale, 401, 'AUTH_USER_NOT_FOUND');
      return;
    }

    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    if (!isDisplayNameConflictError(error)) {
      captureBackendException(error, {
        user: { id: authedReq.userId, email: authedReq.userEmail },
        tags: { operation: 'auth.upsert_profile' },
      });
      apiError(res, authedReq.locale, 500, 'AUTH_PROFILE_SAVE_FAILED');
      return;
    }

    apiError(res, authedReq.locale, 409, 'AUTH_DISPLAY_NAME_TAKEN');
  }
};

export const getMe = async (req: Request, res: Response) => {
  const authedReq = req as AuthedRequest;
  if (!authedReq.hasProfile) {
    throw expectedHttpError(409, 'AUTH_PROFILE_REQUIRED');
  }

  const user = await userRepository.findById(authedReq.userId);
  if (!user) {
    apiError(res, authedReq.locale, 401, 'AUTH_INVALID_TOKEN');
    return;
  }

  res.json({ user: sanitizeUser(user) });
};

export const logout = async (_req: Request, res: Response) => {
  res.status(204).send();
};

export const deleteAccount = async (req: Request, res: Response) => {
  const authedReq = req as AuthedRequest;

  try {
    await deleteAccountService(authedReq.userId, authedReq.locale);
    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete account:', error);
    captureBackendException(error, {
      user: { id: authedReq.userId, email: authedReq.userEmail },
      tags: { operation: 'auth.delete_account' },
    });
    apiError(res, authedReq.locale, 500, 'AUTH_ACCOUNT_DELETE_FAILED');
  }
};

export const updateEmojiPreference = async (req: Request, res: Response) => {
  const authedReq = req as AuthedRequest;
  const body = getValidatedBodyOutput(
    authedReq,
    res,
    safeParseWithSchema(UpdateEmojiPreferenceBodySchema, req.body),
    'AUTH_INVALID_REACTION_TYPE'
  );
  if (!body) {
    return;
  }

  const user = await userRepository.updateEmojiPreference(
    authedReq.userId,
    body.reactionType,
    body.emoji
  );
  respondWithSanitizedUser(authedReq, res, user);
};

export const updateLocale = async (req: Request, res: Response) => {
  const authedReq = req as AuthedRequest;
  const body = getValidatedBodyOutput(
    authedReq,
    res,
    safeParseWithSchema(UpdateLocaleBodySchema, req.body),
    'AUTH_INVALID_LOCALE'
  );
  if (!body) {
    return;
  }

  const user = await userRepository.updateLocale(authedReq.userId, body.locale);
  respondWithSanitizedUser(authedReq, res, user);
};

export const updateHapticsPreference = async (req: Request, res: Response) => {
  const authedReq = req as AuthedRequest;
  const body = getValidatedBodyOutput(
    authedReq,
    res,
    safeParseWithSchema(UpdateHapticsPreferenceBodySchema, req.body),
    'AUTH_INVALID_HAPTICS_ENABLED'
  );
  if (!body) {
    return;
  }

  const user = await userRepository.updateHapticsEnabled(authedReq.userId, body.enabled);
  respondWithSanitizedUser(authedReq, res, user);
};

export const updateDiscardPilePreference = async (req: Request, res: Response) => {
  const authedReq = req as AuthedRequest;
  const body = getValidatedBodyOutput(
    authedReq,
    res,
    safeParseWithSchema(UpdateDiscardPilePreferenceBodySchema, req.body),
    'AUTH_INVALID_DISCARD_PILE_PREFERENCE'
  );
  if (!body) {
    return;
  }

  const user = await userRepository.updateDiscardPileExpandedByDefault(
    authedReq.userId,
    body.enabled
  );
  respondWithSanitizedUser(authedReq, res, user);
};
