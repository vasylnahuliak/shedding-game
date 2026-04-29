import type { AppLocale, ReactionType } from '@shedding-game/shared';

import {
  AuthUserResponseSchema,
  parseWithSchema,
  UpdateDiscardPilePreferenceBodySchema,
  UpdateEmojiPreferenceBodySchema,
  UpdateHapticsPreferenceBodySchema,
  UpdateLocaleBodySchema,
} from '@shedding-game/shared';

import i18n from '@/i18n';

import { AuthServiceError, toAuthServiceError, toPasswordResetError } from './authService.errors';
import { applySupabaseSession } from './authService.redirects';
import {
  clearLocalSession,
  getEmailSignInRedirectTo,
  getPasswordResetRedirectTo,
  setPasswordRecoveryStorage,
  setPendingAuthRedirectIntent,
} from './authService.storage';
import type { User } from './authService.types';
import { fetchCurrentUserAfterSignIn, saveProfileWithErrorHandling } from './authService.user';
import { parseApiResponse } from './contractValidation';
import { api, setAuthToken } from './index';
import { supabase } from './supabase';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const login = async (email: string, password: string): Promise<User> => {
  const normalizedEmail = normalizeEmail(email);
  await applySupabaseSession(
    () =>
      supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      }),
    new AuthServiceError(i18n.t('errors:auth.sessionCreateFailed'), 'AUTH_FAILED')
  );
  await setPasswordRecoveryStorage(false);
  await setPendingAuthRedirectIntent(null);
  return fetchCurrentUserAfterSignIn('errors:auth.loginFailed');
};

export const register = async (
  email: string,
  password: string,
  displayName: string
): Promise<User> => {
  const normalizedEmail = normalizeEmail(email);
  await applySupabaseSession(
    () =>
      supabase.auth.signUp({
        email: normalizedEmail,
        password,
      }),
    new AuthServiceError(
      i18n.t('errors:auth.registrationNeedsEmailConfirm'),
      'EMAIL_CONFIRMATION_REQUIRED'
    )
  );
  await setPasswordRecoveryStorage(false);
  await setPendingAuthRedirectIntent(null);
  return saveProfileWithErrorHandling(displayName, 'errors:auth.saveProfileFailed');
};

export const completeProfile = async (displayName: string): Promise<User> => {
  return saveProfileWithErrorHandling(displayName, 'errors:auth.completeProfileServiceFailed');
};

export const updateProfile = async (displayName: string): Promise<User> => {
  return saveProfileWithErrorHandling(displayName, 'errors:auth.updateProfileFailed');
};

export const requestPasswordReset = async (email: string) => {
  const normalizedEmail = normalizeEmail(email);
  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo: getPasswordResetRedirectTo(),
  });

  if (error) {
    throw new AuthServiceError(
      i18n.t('errors:auth.passwordResetRequestFailed'),
      'PASSWORD_RESET_REQUEST_FAILED'
    );
  }

  await setPendingAuthRedirectIntent('password_recovery');
};

export const requestEmailSignInLink = async (email: string) => {
  const normalizedEmail = normalizeEmail(email);
  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      emailRedirectTo: getEmailSignInRedirectTo(),
      shouldCreateUser: true,
    },
  });

  if (error) {
    throw new AuthServiceError(
      i18n.t('errors:auth.emailLinkRequestFailed'),
      'EMAIL_SIGN_IN_LINK_REQUEST_FAILED'
    );
  }

  await setPendingAuthRedirectIntent('sign_in');
};

export const requestPasswordReauthentication = async () => {
  const { error } = await supabase.auth.reauthenticate();

  if (error) {
    throw new AuthServiceError(
      i18n.t('errors:auth.passwordResetReauthenticationFailed'),
      'PASSWORD_RESET_REAUTHENTICATION_FAILED'
    );
  }
};

export const resetPassword = async (password: string, nonce?: string): Promise<User> => {
  const { error } = await supabase.auth.updateUser(
    nonce ? { password, nonce: nonce.trim() } : { password }
  );

  if (error) {
    throw toPasswordResetError('code' in error ? error.code : null);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new AuthServiceError(
      i18n.t('errors:auth.passwordResetLinkInvalid'),
      'PASSWORD_RESET_LINK_INVALID'
    );
  }

  setAuthToken(session.access_token);
  const user = await fetchCurrentUserAfterSignIn('errors:auth.passwordResetFailed');
  await setPasswordRecoveryStorage(false);
  await setPendingAuthRedirectIntent(null);
  return user;
};

export const logout = async () => {
  try {
    await api.post('auth/logout');
  } catch {
    // Ignore logout API failures and clear local sessions anyway.
  }

  await clearLocalSession();
};

export const deleteAccount = async () => {
  try {
    await api.delete('auth/profile');
  } catch (error) {
    throw await toAuthServiceError(error, i18n.t('errors:auth.deleteAccountFailed'));
  }

  await clearLocalSession({ revokeRemoteSession: false });
};

export const forceLogout = async () => {
  await clearLocalSession({ revokeRemoteSession: false });
};

export const cancelPasswordRecovery = async () => {
  await clearLocalSession({ revokeRemoteSession: false });
};

export const updateEmojiPreference = async (
  reactionType: ReactionType,
  emoji: string
): Promise<User> => {
  const body = parseWithSchema(UpdateEmojiPreferenceBodySchema, { reactionType, emoji });
  const response = await api.put('auth/emoji-preference', {
    json: body,
  });
  const data = await parseApiResponse(
    response,
    AuthUserResponseSchema,
    'PUT auth/emoji-preference'
  );
  return data.user;
};

export const updateHapticsEnabled = async (enabled: boolean): Promise<User> => {
  try {
    const body = parseWithSchema(UpdateHapticsPreferenceBodySchema, { enabled });
    const response = await api.put('auth/haptics-preference', {
      json: body,
    });
    const data = await parseApiResponse(
      response,
      AuthUserResponseSchema,
      'PUT auth/haptics-preference'
    );
    return data.user;
  } catch (error) {
    throw await toAuthServiceError(error, i18n.t('common:profile.haptics.saveFailed'));
  }
};

export const updateDiscardPileExpandedByDefault = async (enabled: boolean): Promise<User> => {
  try {
    const body = parseWithSchema(UpdateDiscardPilePreferenceBodySchema, { enabled });
    const response = await api.put('auth/discard-pile-preference', {
      json: body,
    });
    const data = await parseApiResponse(
      response,
      AuthUserResponseSchema,
      'PUT auth/discard-pile-preference'
    );
    return data.user;
  } catch (error) {
    throw await toAuthServiceError(error, i18n.t('common:profile.discardPile.saveFailed'));
  }
};

export const updateLocale = async (locale: AppLocale): Promise<User> => {
  try {
    const body = parseWithSchema(UpdateLocaleBodySchema, { locale });
    const response = await api.put('auth/locale', {
      json: body,
    });
    const data = await parseApiResponse(response, AuthUserResponseSchema, 'PUT auth/locale');
    return data.user;
  } catch (error) {
    throw await toAuthServiceError(error, i18n.t('common:language.saveFailed'));
  }
};
