import type { Request, Response } from 'express';
import * as v from 'valibot';

import { safeParseWithSchema } from '@shedding-game/shared';

import { accountDeletionRequestRepository } from '@/db/repositories/accountDeletionRequestRepository';
import { captureBackendException } from '@/services/sentry';
import type { RequestWithLocale } from '@/types';

const AccountDeletionRequestBodySchema = v.object({
  email: v.string(),
  userId: v.optional(v.string()),
  displayName: v.optional(v.string()),
  notes: v.optional(v.string()),
});

const normalizeRequiredText = (value: string, maxLength: number): string =>
  value.trim().slice(0, maxLength);

const normalizeOptionalText = (value: string | undefined, maxLength: number): string | null => {
  const trimmedValue = value?.trim();
  if (!trimmedValue) {
    return null;
  }

  return trimmedValue.slice(0, maxLength);
};

const looksLikeEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const createAccountDeletionRequest = async (req: Request, res: Response) => {
  const requestWithLocale = req as RequestWithLocale;
  const bodyResult = safeParseWithSchema(AccountDeletionRequestBodySchema, req.body);

  if (!bodyResult.success) {
    res.status(400).json({
      error: 'invalid_request',
      message: 'Provide a valid account deletion request payload.',
    });
    return;
  }

  const email = normalizeRequiredText(bodyResult.output.email, 320).toLowerCase();
  const userId = normalizeOptionalText(bodyResult.output.userId, 120);
  const displayName = normalizeOptionalText(bodyResult.output.displayName, 80);
  const notes = normalizeOptionalText(bodyResult.output.notes, 600);

  if (!email || !looksLikeEmail(email)) {
    res.status(400).json({
      error: 'invalid_email',
      message: 'Provide a valid email address.',
    });
    return;
  }

  try {
    await accountDeletionRequestRepository.create({
      requestId: requestWithLocale.requestId,
      email,
      userId,
      displayName,
      notes,
      locale: requestWithLocale.locale,
      source: 'public_web_form',
    });

    res.status(202).json({
      status: 'accepted',
      requestId: requestWithLocale.requestId,
      message: 'Your account deletion request has been received.',
    });
  } catch (error) {
    captureBackendException(error, {
      tags: { operation: 'account_deletion_requests.create' },
      extra: { requestId: requestWithLocale.requestId },
    });

    res.status(500).json({
      error: 'request_failed',
      message: 'Failed to record the account deletion request.',
    });
  }
};
