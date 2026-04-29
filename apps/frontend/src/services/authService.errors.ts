import type { BackendMessageCode } from '@shedding-game/shared';
import { HTTPError } from 'ky';

import i18n from '@/i18n';
import { translateBackendMessage } from '@/i18n/backendMessages';

import type { ApiErrorBody } from './authService.types';
import { readHttpErrorBody } from './httpError';

export class AuthServiceError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.name = 'AuthServiceError';
    this.code = code;
    this.status = status;
  }
}

export const normalizeSupabaseAuthErrorMessage = (message: string) => {
  const normalizedMessage = message.trim().toLowerCase();

  if (normalizedMessage === 'invalid login credentials') {
    return i18n.t('errors:auth.invalidLoginCredentials');
  }

  return message;
};

export const getSupabaseAuthErrorCode = (error: unknown) => {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return null;
  }

  return typeof error.code === 'string' ? error.code : null;
};

export const isMissingSessionError = (error: { message: string } | null) =>
  error?.message.trim().toLowerCase() === 'auth session missing!';

export const toPasswordResetError = (errorCode?: string | null) => {
  if (errorCode === 'same_password') {
    return new AuthServiceError(i18n.t('errors:auth.passwordResetSameAsOld'), errorCode);
  }

  if (errorCode === 'reauthentication_needed') {
    return new AuthServiceError(
      i18n.t('errors:auth.passwordResetReauthenticationNeeded'),
      errorCode
    );
  }

  if (errorCode === 'reauthentication_not_valid') {
    return new AuthServiceError(i18n.t('errors:auth.passwordResetCodeInvalid'), errorCode);
  }

  return new AuthServiceError(i18n.t('errors:auth.passwordResetFailed'), errorCode ?? undefined);
};

export const toProviderLinkError = (errorCode?: string | null) => {
  if (errorCode === 'identity_already_exists') {
    return new AuthServiceError(i18n.t('errors:auth.providerAlreadyLinked'), errorCode);
  }

  if (errorCode === 'manual_linking_disabled') {
    return new AuthServiceError(i18n.t('errors:auth.providerLinkingUnavailable'), errorCode);
  }

  return new AuthServiceError(i18n.t('errors:auth.providerLinkFailed'), errorCode ?? undefined);
};

export const toProviderUnlinkError = (errorCode?: string | null) => {
  if (
    errorCode === 'single_identity_not_deletable' ||
    errorCode === 'email_conflict_identity_not_deletable'
  ) {
    return new AuthServiceError(i18n.t('errors:auth.lastAuthMethodCannotBeRemoved'), errorCode);
  }

  if (errorCode === 'identity_not_found') {
    return new AuthServiceError(i18n.t('errors:auth.authMethodNotFound'), errorCode);
  }

  if (errorCode === 'manual_linking_disabled') {
    return new AuthServiceError(i18n.t('errors:auth.providerLinkingUnavailable'), errorCode);
  }

  return new AuthServiceError(i18n.t('errors:auth.providerUnlinkFailed'), errorCode ?? undefined);
};

export const toAuthServiceError = async (error: unknown, fallbackMessage: string) => {
  if (error instanceof AuthServiceError) {
    return error;
  }

  if (error instanceof HTTPError) {
    const body = await readHttpErrorBody<ApiErrorBody>(error);
    return new AuthServiceError(
      translateBackendMessage(body, fallbackMessage),
      body?.code,
      error.response.status
    );
  }

  if (error instanceof Error) {
    return new AuthServiceError(normalizeSupabaseAuthErrorMessage(error.message));
  }

  return new AuthServiceError(fallbackMessage);
};

export const hasApiErrorCode = async (
  error: unknown,
  expectedCode: BackendMessageCode | string
) => {
  if (!(error instanceof HTTPError)) {
    return false;
  }

  const body = await readHttpErrorBody<ApiErrorBody>(error);
  return body?.code === expectedCode;
};
