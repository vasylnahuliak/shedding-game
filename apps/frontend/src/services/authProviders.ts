export type OAuthProviderId = 'google' | 'apple';
export type AuthMethodId = 'email' | OAuthProviderId;

export type AuthMethod = {
  id: AuthMethodId;
  linked: boolean;
  canUnlink: boolean;
};

type OAuthProviderConfig = {
  id: OAuthProviderId;
  authActionLabelKey: 'auth:actions.google' | 'auth:actions.apple';
  authLoadingLabelKey: 'auth:actions.loading.google' | 'auth:actions.loading.apple';
  profileLabelKey: 'common:profile.authMethods.google' | 'common:profile.authMethods.apple';
  profileConnectLabelKey:
    | 'common:profile.authMethods.actions.connectGoogle'
    | 'common:profile.authMethods.actions.connectApple';
  profileDisconnectLabelKey:
    | 'common:profile.authMethods.actions.disconnectGoogle'
    | 'common:profile.authMethods.actions.disconnectApple';
  profileConnectingLabelKey:
    | 'common:profile.authMethods.actions.connectingGoogle'
    | 'common:profile.authMethods.actions.connectingApple';
  profileDisconnectingLabelKey:
    | 'common:profile.authMethods.actions.disconnectingGoogle'
    | 'common:profile.authMethods.actions.disconnectingApple';
};

export const OAUTH_PROVIDER_CONFIGS: readonly OAuthProviderConfig[] = [
  {
    id: 'apple',
    authActionLabelKey: 'auth:actions.apple',
    authLoadingLabelKey: 'auth:actions.loading.apple',
    profileLabelKey: 'common:profile.authMethods.apple',
    profileConnectLabelKey: 'common:profile.authMethods.actions.connectApple',
    profileDisconnectLabelKey: 'common:profile.authMethods.actions.disconnectApple',
    profileConnectingLabelKey: 'common:profile.authMethods.actions.connectingApple',
    profileDisconnectingLabelKey: 'common:profile.authMethods.actions.disconnectingApple',
  },
  {
    id: 'google',
    authActionLabelKey: 'auth:actions.google',
    authLoadingLabelKey: 'auth:actions.loading.google',
    profileLabelKey: 'common:profile.authMethods.google',
    profileConnectLabelKey: 'common:profile.authMethods.actions.connectGoogle',
    profileDisconnectLabelKey: 'common:profile.authMethods.actions.disconnectGoogle',
    profileConnectingLabelKey: 'common:profile.authMethods.actions.connectingGoogle',
    profileDisconnectingLabelKey: 'common:profile.authMethods.actions.disconnectingGoogle',
  },
] as const;

export const AUTH_METHOD_IDS: readonly AuthMethodId[] = [
  'email',
  ...OAUTH_PROVIDER_CONFIGS.map((provider) => provider.id),
] as const;

export const hasPasswordAuthMethod = (authMethods: readonly AuthMethod[]) =>
  authMethods.some((method) => method.id === 'email' && method.linked);
