import {
  AuthUserResponseSchema,
  parseWithSchema,
  UpsertProfileBodySchema,
} from '@shedding-game/shared';

import i18n from '@/i18n';

import { AUTH_METHOD_IDS, type AuthMethod } from './authProviders';
import {
  AuthServiceError,
  getSupabaseAuthErrorCode,
  hasApiErrorCode,
  isMissingSessionError,
  normalizeSupabaseAuthErrorMessage,
  toAuthServiceError,
} from './authService.errors';
import { getPasswordRecoveryStorage } from './authService.storage';
import type { AuthHydrationResult, SupabaseIdentity, User } from './authService.types';
import { parseApiResponse } from './contractValidation';
import { api, setAuthToken } from './index';
import { supabase } from './supabase';

const buildAuthMethods = (params: {
  primaryProvider?: string;
  linkedProviders?: string[];
  identities?: readonly SupabaseIdentity[] | null;
}) => {
  const linkedProviders = new Set<string>(params.linkedProviders ?? []);
  const identities = params.identities ?? [];

  if (params.primaryProvider) {
    linkedProviders.add(params.primaryProvider);
  }

  for (const identity of identities) {
    linkedProviders.add(identity.provider);
  }

  const linkedMethodIds = AUTH_METHOD_IDS.filter((methodId) => linkedProviders.has(methodId));
  const linkedMethodCount = linkedMethodIds.length;

  return AUTH_METHOD_IDS.map((methodId) => {
    const linked = linkedProviders.has(methodId);
    return {
      id: methodId,
      linked,
      canUnlink: methodId !== 'email' && linked && linkedMethodCount > 1,
    } satisfies AuthMethod;
  });
};

const fetchCurrentUser = async (): Promise<User> => {
  const response = await api.get('auth/me');
  const data = await parseApiResponse(response, AuthUserResponseSchema, 'GET auth/me');
  return data.user;
};

export const fetchCurrentUserAfterSignIn = async (
  fallbackKey: 'errors:auth.loginFailed' | 'errors:auth.passwordResetFailed'
): Promise<User> => {
  try {
    return await fetchCurrentUser();
  } catch (error) {
    if (await hasApiErrorCode(error, 'AUTH_PROFILE_REQUIRED')) {
      throw new AuthServiceError(i18n.t('errors:auth.profileRequired'), 'AUTH_PROFILE_REQUIRED');
    }

    throw await toAuthServiceError(error, i18n.t(fallbackKey));
  }
};

const saveProfile = async (displayName: string): Promise<User> => {
  const body = parseWithSchema(UpsertProfileBodySchema, { displayName });
  const response = await api.put('auth/profile', {
    json: body,
  });
  const data = await parseApiResponse(response, AuthUserResponseSchema, 'PUT auth/profile');
  return data.user;
};

export const saveProfileWithErrorHandling = async (
  displayName: string,
  fallbackKey:
    | 'errors:auth.saveProfileFailed'
    | 'errors:auth.completeProfileServiceFailed'
    | 'errors:auth.updateProfileFailed'
): Promise<User> => {
  try {
    return await saveProfile(displayName);
  } catch (error) {
    throw await toAuthServiceError(error, i18n.t(fallbackKey));
  }
};

export const refreshAuthMethods = async (): Promise<AuthMethod[]> => {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    if (isMissingSessionError(error)) {
      return [];
    }

    throw new AuthServiceError(
      normalizeSupabaseAuthErrorMessage(error.message),
      getSupabaseAuthErrorCode(error) ?? undefined
    );
  }

  if (!data.user) {
    return [];
  }

  return buildAuthMethods({
    primaryProvider: data.user.app_metadata.provider,
    linkedProviders: data.user.app_metadata.providers,
    identities: data.user.identities as SupabaseIdentity[] | undefined,
  });
};

export const hydrate = async (): Promise<AuthHydrationResult> => {
  const passwordRecoveryPending = await getPasswordRecoveryStorage();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    setAuthToken(session.access_token);

    if (passwordRecoveryPending) {
      return {
        user: null,
        needsProfileSetup: false,
        passwordRecoveryPending: true,
        authMethods: [],
      };
    }

    try {
      const user = await fetchCurrentUser();
      let authMethods: AuthMethod[] = [];

      try {
        authMethods = await refreshAuthMethods();
      } catch {
        authMethods = [];
      }

      return { user, needsProfileSetup: false, passwordRecoveryPending: false, authMethods };
    } catch (error) {
      if (await hasApiErrorCode(error, 'AUTH_PROFILE_REQUIRED')) {
        return {
          user: null,
          needsProfileSetup: true,
          passwordRecoveryPending: false,
          authMethods: [],
        };
      }

      await supabase.auth.signOut();
      setAuthToken(null);
    }
  }

  if (passwordRecoveryPending) {
    const { setPasswordRecoveryStorage } = await import('./authService.storage');
    await setPasswordRecoveryStorage(false);
  }

  setAuthToken(null);
  return { user: null, needsProfileSetup: false, passwordRecoveryPending: false, authMethods: [] };
};
