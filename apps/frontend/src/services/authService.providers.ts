import i18n from '@/i18n';

import type { OAuthProviderId } from './authProviders';
import { requestAppleIdToken } from './authService.apple';
import {
  AuthServiceError,
  getSupabaseAuthErrorCode,
  normalizeSupabaseAuthErrorMessage,
  toProviderLinkError,
  toProviderUnlinkError,
} from './authService.errors';
import {
  consumeAuthRedirect,
  consumePasswordRecoveryLink,
  runOAuthFlow,
} from './authService.redirects';
import { setPasswordRecoveryStorage, setPendingAuthRedirectIntent } from './authService.storage';
import { fetchCurrentUserAfterSignIn } from './authService.user';
import { setAuthToken } from './index';
import { supabase } from './supabase';

export { consumeAuthRedirect, consumePasswordRecoveryLink };

export const signInWithProvider = async (provider: OAuthProviderId) => {
  if (provider === 'apple') {
    const appleSignInResult = await requestAppleIdToken(
      i18n.t('errors:auth.loginFailed'),
      'APPLE_AUTH_UNAVAILABLE'
    );

    if (!appleSignInResult) {
      return;
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: appleSignInResult.token,
      nonce: appleSignInResult.nonce,
    });

    if (error) {
      throw new AuthServiceError(
        normalizeSupabaseAuthErrorMessage(error.message),
        getSupabaseAuthErrorCode(error) ?? undefined
      );
    }

    const accessToken = data.session?.access_token;
    if (!accessToken) {
      throw new AuthServiceError(i18n.t('errors:auth.sessionCreateFailed'), 'AUTH_FAILED');
    }

    setAuthToken(accessToken);
    await setPasswordRecoveryStorage(false);
    await setPendingAuthRedirectIntent(null);
    return fetchCurrentUserAfterSignIn('errors:auth.loginFailed');
  }

  const redirectType = await runOAuthFlow(
    'sign_in',
    (redirectTo) =>
      supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      }),
    new AuthServiceError(i18n.t('errors:auth.loginFailed'), 'AUTH_FAILED')
  );

  if (!redirectType) {
    return;
  }

  if (redirectType !== 'oauthSignIn') {
    throw new AuthServiceError(i18n.t('errors:auth.loginFailed'), 'AUTH_FAILED');
  }

  return fetchCurrentUserAfterSignIn('errors:auth.loginFailed');
};

export const linkProvider = async (provider: OAuthProviderId) => {
  if (provider === 'apple') {
    const appleSignInResult = await requestAppleIdToken(
      i18n.t('errors:auth.providerLinkFailed'),
      'APPLE_AUTH_UNAVAILABLE'
    );

    if (!appleSignInResult) {
      return;
    }

    const { data, error } = await supabase.auth.linkIdentity({
      provider: 'apple',
      token: appleSignInResult.token,
      nonce: appleSignInResult.nonce,
    });

    if (error) {
      throw toProviderLinkError(getSupabaseAuthErrorCode(error));
    }

    const accessToken = data.session?.access_token;
    if (!accessToken) {
      throw new AuthServiceError(i18n.t('errors:auth.providerLinkFailed'), 'AUTH_FAILED');
    }

    setAuthToken(accessToken);
    await setPendingAuthRedirectIntent(null);
    return;
  }

  const redirectType = await runOAuthFlow(
    'link_identity',
    (redirectTo) =>
      supabase.auth.linkIdentity({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      }),
    new AuthServiceError(i18n.t('errors:auth.providerLinkFailed'), 'AUTH_FAILED'),
    toProviderLinkError
  );

  if (!redirectType) {
    return;
  }

  if (redirectType !== 'identityLink') {
    throw new AuthServiceError(i18n.t('errors:auth.providerLinkFailed'), 'AUTH_FAILED');
  }
};

export const unlinkProvider = async (provider: OAuthProviderId) => {
  const { data, error } = await supabase.auth.getUserIdentities();

  if (error) {
    throw toProviderUnlinkError(getSupabaseAuthErrorCode(error));
  }

  const identity = data.identities.find((item) => item.provider === provider);
  if (!identity) {
    throw toProviderUnlinkError('identity_not_found');
  }

  const unlinkResult = await supabase.auth.unlinkIdentity(identity);

  if (unlinkResult.error) {
    throw toProviderUnlinkError(getSupabaseAuthErrorCode(unlinkResult.error));
  }
};
