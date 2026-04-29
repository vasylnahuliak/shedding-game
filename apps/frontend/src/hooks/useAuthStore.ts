import type { AppLocale, ReactionType } from '@shedding-game/shared';
import { create } from 'zustand';

import { resolveAppLocale } from '@shedding-game/shared';

import { queryClient } from '@/api/query-client';
import i18n from '@/i18n';
import { analytics } from '@/services/analytics';
import type { AuthMethod, OAuthProviderId } from '@/services/authProviders';
import { AuthService, AuthServiceError, type User } from '@/services/AuthService';
import { SocketService } from '@/services/SocketService';

type AuthStore = {
  user: User | null;
  authMethods: AuthMethod[];
  isLoading: boolean;
  needsProfileSetup: boolean;
  passwordRecoveryPending: boolean;
  login: (email: string, password: string) => Promise<User>;
  signInWithProvider: (provider: OAuthProviderId) => Promise<void>;
  linkProvider: (provider: OAuthProviderId) => Promise<void>;
  unlinkProvider: (provider: OAuthProviderId) => Promise<void>;
  refreshAuthMethods: () => Promise<void>;
  requestEmailSignInLink: (email: string) => Promise<void>;
  register: (displayName: string, email: string, password: string) => Promise<User>;
  completeProfile: (displayName: string) => Promise<User>;
  updateProfile: (displayName: string) => Promise<User>;
  requestPasswordReset: (email: string) => Promise<void>;
  requestPasswordReauthentication: () => Promise<void>;
  resetPassword: (password: string, nonce?: string) => Promise<User>;
  cancelPasswordRecovery: () => Promise<void>;
  logout: () => Promise<void>;
  forceLogout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateEmojiPreference: (reactionType: ReactionType, emoji: string) => Promise<void>;
  updateHapticsEnabled: (enabled: boolean) => Promise<void>;
  updateDiscardPileExpandedByDefault: (enabled: boolean) => Promise<void>;
  setLocale: (locale: AppLocale) => Promise<void>;
  beginPasswordRecovery: () => void;
  setAuthState: (
    user: User | null,
    needsProfileSetup: boolean,
    passwordRecoveryPending?: boolean,
    authMethods?: AuthMethod[]
  ) => void;
  setLoading: (isLoading: boolean) => void;
};

const isProfileRequiredError = (error: unknown) =>
  error instanceof AuthServiceError && error.code === 'AUTH_PROFILE_REQUIRED';

export const useAuthStore = create<AuthStore>((set, get) => {
  const syncAuthMethods = async (shouldThrow = false) => {
    try {
      return await AuthService.refreshAuthMethods();
    } catch (error) {
      if (shouldThrow) {
        throw error;
      }

      return get().authMethods;
    }
  };

  const applyAuthenticatedUser = async (nextUser: User) => {
    const authMethods = await syncAuthMethods();
    await i18n.changeLanguage(nextUser.locale);
    SocketService.updateLocale(nextUser.locale);
    set({
      user: nextUser,
      authMethods,
      needsProfileSetup: false,
      passwordRecoveryPending: false,
    });

    return nextUser;
  };

  const setNeedsProfileSetup = () => {
    set({
      user: null,
      authMethods: [],
      needsProfileSetup: true,
      passwordRecoveryPending: false,
    });
  };

  const resetAuthState = (passwordRecoveryPending = false) => {
    queryClient.clear();
    set({
      user: null,
      authMethods: [],
      needsProfileSetup: false,
      passwordRecoveryPending,
    });
  };

  const runAndResetAuthState = async (action: () => Promise<void>) => {
    await action();
    resetAuthState();
  };

  return {
    user: null,
    authMethods: [],
    isLoading: true,
    needsProfileSetup: false,
    passwordRecoveryPending: false,
    login: async (email: string, password: string) => {
      try {
        const loggedInUser = await AuthService.login(email, password);
        await applyAuthenticatedUser(loggedInUser);
        analytics.track('auth_completed', { method: 'login' });
        return loggedInUser;
      } catch (error) {
        if (isProfileRequiredError(error)) {
          setNeedsProfileSetup();
        }
        throw error;
      }
    },
    signInWithProvider: async (provider: OAuthProviderId) => {
      try {
        const loggedInUser = await AuthService.signInWithProvider(provider);
        if (!loggedInUser) {
          return;
        }

        await applyAuthenticatedUser(loggedInUser);
        analytics.track('auth_completed', { method: provider });
      } catch (error) {
        if (isProfileRequiredError(error)) {
          setNeedsProfileSetup();
        }

        throw error;
      }
    },
    linkProvider: async (provider: OAuthProviderId) => {
      await AuthService.linkProvider(provider);
      const authMethods = await syncAuthMethods(true);
      set({ authMethods });
    },
    unlinkProvider: async (provider: OAuthProviderId) => {
      await AuthService.unlinkProvider(provider);
      const authMethods = await syncAuthMethods(true);
      set({ authMethods });
    },
    refreshAuthMethods: async () => {
      if (!get().user) {
        set({ authMethods: [] });
        return;
      }

      const authMethods = await syncAuthMethods(true);
      set({ authMethods });
    },
    requestEmailSignInLink: async (email: string) => {
      await AuthService.requestEmailSignInLink(email);
    },
    register: async (displayName: string, email: string, password: string) => {
      const registeredUser = await AuthService.register(email, password, displayName);
      await applyAuthenticatedUser(registeredUser);
      analytics.track('auth_completed', { method: 'register' });
      return registeredUser;
    },
    completeProfile: async (displayName: string) => {
      const completedUser = await AuthService.completeProfile(displayName);
      await applyAuthenticatedUser(completedUser);
      analytics.track('auth_completed', { method: 'complete_profile' });
      return completedUser;
    },
    updateProfile: async (displayName: string) => {
      const updatedUser = await AuthService.updateProfile(displayName);
      await i18n.changeLanguage(updatedUser.locale);
      SocketService.updateLocale(updatedUser.locale);
      set({ user: updatedUser, needsProfileSetup: false, passwordRecoveryPending: false });
      return updatedUser;
    },
    requestPasswordReset: async (email: string) => {
      await AuthService.requestPasswordReset(email);
    },
    requestPasswordReauthentication: async () => {
      await AuthService.requestPasswordReauthentication();
    },
    resetPassword: async (password: string, nonce?: string) => {
      try {
        const updatedUser = await AuthService.resetPassword(password, nonce);
        await applyAuthenticatedUser(updatedUser);
        queryClient.clear();
        analytics.track('auth_completed', { method: 'password_reset' });
        return updatedUser;
      } catch (error) {
        if (isProfileRequiredError(error)) {
          setNeedsProfileSetup();
        }

        throw error;
      }
    },
    cancelPasswordRecovery: async () => {
      await runAndResetAuthState(() => AuthService.cancelPasswordRecovery());
    },
    logout: async () => {
      await runAndResetAuthState(() => AuthService.logout());
    },
    forceLogout: async () => {
      await runAndResetAuthState(() => AuthService.forceLogout());
    },
    deleteAccount: async () => {
      await runAndResetAuthState(() => AuthService.deleteAccount());
    },
    updateEmojiPreference: async (reactionType: ReactionType, emoji: string) => {
      const updatedUser = await AuthService.updateEmojiPreference(reactionType, emoji);
      set({ user: updatedUser });
    },
    updateHapticsEnabled: async (enabled: boolean) => {
      const updatedUser = await AuthService.updateHapticsEnabled(enabled);
      set({ user: updatedUser });
    },
    updateDiscardPileExpandedByDefault: async (enabled: boolean) => {
      const updatedUser = await AuthService.updateDiscardPileExpandedByDefault(enabled);
      set({ user: updatedUser });
    },
    setLocale: async (locale: AppLocale) => {
      const previousLocale = resolveAppLocale(i18n.language);
      if (previousLocale === locale) {
        return;
      }

      await i18n.changeLanguage(locale);
      SocketService.updateLocale(locale);

      if (!get().user) {
        return;
      }

      try {
        const updatedUser = await AuthService.updateLocale(locale);
        set({ user: updatedUser });
      } catch (error) {
        await i18n.changeLanguage(previousLocale);
        SocketService.updateLocale(previousLocale);
        throw error;
      }
    },
    beginPasswordRecovery: () => {
      resetAuthState(true);
    },
    setAuthState: (
      user: User | null,
      needsProfileSetup: boolean,
      passwordRecoveryPending = false,
      authMethods = []
    ) => set({ user, authMethods, needsProfileSetup, passwordRecoveryPending }),
    setLoading: (isLoading: boolean) => set({ isLoading }),
  };
});

export const useAuth = <T>(selector: (state: AuthStore) => T) => useAuthStore(selector);
