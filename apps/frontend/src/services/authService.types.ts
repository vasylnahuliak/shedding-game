import type { AuthUser as SharedAuthUser, BackendMessageCode } from '@shedding-game/shared';

import type { AuthMethod } from './authProviders';

export type User = SharedAuthUser;

export type AuthHydrationResult = {
  user: User | null;
  needsProfileSetup: boolean;
  passwordRecoveryPending: boolean;
  authMethods: AuthMethod[];
};

export type ConsumedAuthRedirect = 'passwordRecovery' | 'oauthSignIn' | 'identityLink' | null;
export type PendingAuthRedirectIntent = 'sign_in' | 'link_identity' | 'password_recovery';

export type ApiErrorBody = {
  message?: string;
  code?: BackendMessageCode;
  params?: Record<string, string | number>;
};

export type SupabaseAuthLikeResult = {
  data: {
    session: {
      access_token?: string | null;
    } | null;
  };
  error: {
    message: string;
  } | null;
};

export type AuthRedirectParams = {
  accessToken: string | null;
  refreshToken: string | null;
  type: string | null;
  errorCode: string | null;
  errorDescription: string | null;
};

export type OAuthUrlResult = {
  data: {
    url?: string | null;
  };
  error: {
    message: string;
    code?: string;
  } | null;
};

export type SupabaseIdentity = {
  identity_id: string;
  provider: string;
};

export type AsyncStorageLike = {
  removeItem: (key: string) => Promise<void> | void;
};

export type AppleSignInResult = {
  token: string;
  nonce: string;
} | null;

export type SupabaseAuthStorageAccess = {
  storageKey?: string;
  storage?: AsyncStorageLike | null;
  userStorage?: AsyncStorageLike | null;
};
