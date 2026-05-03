import * as WebBrowser from 'expo-web-browser';

import i18n from '@/i18n';

import { AuthServiceError } from './authService.errors';
import {
  getOAuthRedirectTo,
  getPendingAuthRedirectIntent,
  setPasswordRecoveryStorage,
  setPendingAuthRedirectIntent,
} from './authService.storage';
import type {
  AuthRedirectParams,
  ConsumedAuthRedirect,
  OAuthUrlResult,
  PendingAuthRedirectIntent,
  SupabaseAuthLikeResult,
} from './authService.types';
import { setAuthToken } from './authToken';
import { supabase } from './supabase';

const parseParamString = (rawValue: string) => {
  const params = new Map<string, string>();

  for (const pair of rawValue.replace(/^[?#]/, '').split('&')) {
    if (!pair) {
      continue;
    }

    const separatorIndex = pair.indexOf('=');
    const rawKey = separatorIndex >= 0 ? pair.slice(0, separatorIndex) : pair;
    const rawParamValue = separatorIndex >= 0 ? pair.slice(separatorIndex + 1) : '';
    const decode = (value: string) => decodeURIComponent(value.replace(/\+/g, ' '));

    params.set(decode(rawKey), decode(rawParamValue));
  }

  return params;
};

const parseAuthRedirectParams = (url: string): AuthRedirectParams => {
  const hashIndex = url.indexOf('#');
  const beforeHash = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
  const hashPart = hashIndex >= 0 ? url.slice(hashIndex + 1) : '';
  const queryIndex = beforeHash.indexOf('?');
  const queryPart = queryIndex >= 0 ? beforeHash.slice(queryIndex + 1) : '';
  const mergedParams = new Map([
    ...parseParamString(queryPart).entries(),
    ...parseParamString(hashPart).entries(),
  ]);

  return {
    accessToken: mergedParams.get('access_token') ?? null,
    refreshToken: mergedParams.get('refresh_token') ?? null,
    type: mergedParams.get('type') ?? null,
    errorCode: mergedParams.get('error_code') ?? mergedParams.get('error') ?? null,
    errorDescription: mergedParams.get('error_description') ?? null,
  };
};

const isAuthRedirect = (params: AuthRedirectParams) =>
  Boolean(
    params.type ||
    params.accessToken ||
    params.refreshToken ||
    params.errorCode ||
    params.errorDescription
  );

export const applySupabaseSession = async (
  request: () => Promise<SupabaseAuthLikeResult>,
  missingTokenError: AuthServiceError
) => {
  const { data, error } = await request();

  if (error) {
    throw new AuthServiceError(error.message.trim(), 'AUTH_FAILED');
  }

  const accessToken = data.session?.access_token;
  if (!accessToken) {
    throw missingTokenError;
  }

  setAuthToken(accessToken);
};

const applySessionFromRedirectParams = async (
  params: AuthRedirectParams,
  invalidLinkError: AuthServiceError
) => {
  if (params.errorCode || !params.accessToken || !params.refreshToken) {
    throw invalidLinkError;
  }

  const { data, error } = await supabase.auth.setSession({
    access_token: params.accessToken,
    refresh_token: params.refreshToken,
  });

  if (error || !data.session?.access_token) {
    throw invalidLinkError;
  }

  setAuthToken(data.session.access_token);
};

export const consumeAuthRedirect = async (
  url: string | null | undefined
): Promise<ConsumedAuthRedirect> => {
  if (!url) {
    return null;
  }

  const params = parseAuthRedirectParams(url);
  if (!isAuthRedirect(params)) {
    return null;
  }

  const pendingIntent = await getPendingAuthRedirectIntent();

  if (params.type === 'recovery') {
    await setPendingAuthRedirectIntent(null);
    await applySessionFromRedirectParams(
      params,
      new AuthServiceError(
        i18n.t('errors:auth.passwordResetLinkInvalid'),
        'PASSWORD_RESET_LINK_INVALID'
      )
    );

    await setPasswordRecoveryStorage(true);
    return 'passwordRecovery';
  }

  const resolvedIntent = pendingIntent === 'link_identity' ? 'link_identity' : 'sign_in';
  const invalidRedirectError =
    resolvedIntent === 'link_identity'
      ? new AuthServiceError(i18n.t('errors:auth.providerLinkFailed'), 'AUTH_FAILED')
      : new AuthServiceError(i18n.t('errors:auth.loginFailed'), 'AUTH_FAILED');

  if (params.errorCode) {
    await setPendingAuthRedirectIntent(null);
    throw new AuthServiceError(
      params.errorDescription ??
        (resolvedIntent === 'link_identity'
          ? i18n.t('errors:auth.providerLinkFailed')
          : i18n.t('errors:auth.loginFailed')),
      params.errorCode
    );
  }

  if (!params.accessToken || !params.refreshToken) {
    await setPendingAuthRedirectIntent(null);
    return null;
  }

  await setPendingAuthRedirectIntent(null);
  await applySessionFromRedirectParams(params, invalidRedirectError);
  await setPasswordRecoveryStorage(false);
  return resolvedIntent === 'link_identity' ? 'identityLink' : 'oauthSignIn';
};

export const consumePasswordRecoveryLink = async (url: string | null | undefined) => {
  const redirectType = await consumeAuthRedirect(url);

  if (redirectType === 'passwordRecovery') {
    return true;
  }

  if (redirectType === 'oauthSignIn' || redirectType === 'identityLink') {
    throw new AuthServiceError(
      i18n.t('errors:auth.passwordResetLinkInvalid'),
      'PASSWORD_RESET_LINK_INVALID'
    );
  }

  return false;
};

export const runOAuthFlow = async (
  intent: PendingAuthRedirectIntent,
  request: (redirectTo: string) => Promise<OAuthUrlResult>,
  fallbackError: AuthServiceError,
  errorMapper?: (errorCode?: string | null) => AuthServiceError
) => {
  const redirectTo = getOAuthRedirectTo();
  let hasStoredIntent = false;

  try {
    const { data, error } = await request(redirectTo);

    if (error) {
      const errorCode = error.code ?? fallbackError.code;
      if (errorMapper) {
        throw errorMapper(errorCode);
      }

      throw new AuthServiceError(error.message, errorCode);
    }

    const authUrl = data.url;
    if (!authUrl) {
      throw fallbackError;
    }

    await setPendingAuthRedirectIntent(intent);
    hasStoredIntent = true;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectTo);
    if (result.type !== 'success' || !result.url) {
      await setPendingAuthRedirectIntent(null);
      return null;
    }

    return await consumeAuthRedirect(result.url);
  } catch (error) {
    if (hasStoredIntent) {
      await setPendingAuthRedirectIntent(null);
    }

    throw error;
  }
};
