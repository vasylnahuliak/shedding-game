import React, { useEffect, useEffectEvent, useRef } from 'react';

import * as Linking from 'expo-linking';

import { queryClient } from '@/api/query-client';
import { useAuthStore } from '@/hooks/useAuthStore';
import i18n, { useAppTranslation } from '@/i18n';
import { setOnUnauthorized } from '@/services';
import { AuthService, AuthServiceError } from '@/services/AuthService';
import { getAuthToken } from '@/services/authToken';
import { LoggingService } from '@/services/LoggingService';
import { SocketService } from '@/services/SocketService';
import { showAlert } from '@/utils/alert';
import { delay } from '@/utils/async';

const MIN_LOADING_DURATION_MS = 1000;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { t } = useAppTranslation('alerts');
  const user = useAuthStore((state) => state.user);
  const passwordRecoveryPending = useAuthStore((state) => state.passwordRecoveryPending);
  const hasShownSessionExpiredRef = useRef(false);

  const syncHydratedAuthState = useEffectEvent(async (passwordRecoveryFromRedirect = false) => {
    const hydratedAuth = await AuthService.hydrate();

    if (hydratedAuth.user) {
      await i18n.changeLanguage(hydratedAuth.user.locale);
      SocketService.updateLocale(hydratedAuth.user.locale);
    }

    useAuthStore
      .getState()
      .setAuthState(
        hydratedAuth.user,
        hydratedAuth.needsProfileSetup,
        passwordRecoveryFromRedirect || hydratedAuth.passwordRecoveryPending,
        hydratedAuth.authMethods
      );
  });

  const consumeAuthRedirect = useEffectEvent(async (url: string | null | undefined) => {
    try {
      return await AuthService.consumeAuthRedirect(url);
    } catch (error) {
      const errorMessage =
        error instanceof AuthServiceError ? error.message : i18n.t('errors:auth.loginFailed');
      showAlert(i18n.t('alerts:titles.error'), errorMessage, [
        { text: i18n.t('common:buttons.ok') },
      ]);
      return null;
    }
  });

  useEffect(
    function registerUnauthorizedHandler() {
      const handleUnauthorized = () => {
        // Ignore 401s during initial hydration (token not yet set)
        if (useAuthStore.getState().isLoading) return;
        // Ignore stale 401s after an intentional logout/account deletion.
        if (!getAuthToken()) return;
        // Prevent showing multiple alerts
        if (hasShownSessionExpiredRef.current) return;
        hasShownSessionExpiredRef.current = true;

        void AuthService.forceLogout().then(() => {
          queryClient.clear();
          useAuthStore.getState().setAuthState(null, false);
          showAlert(t('titles.sessionExpired'), t('messages.sessionExpired'), [
            {
              text: t('common:buttons.ok'),
              onPress: () => {
                hasShownSessionExpiredRef.current = false;
              },
            },
          ]);
        });
      };

      setOnUnauthorized(handleUnauthorized);
      return () => setOnUnauthorized(null);
    },
    [t]
  );

  useEffect(function hydrateAuthStateOnMount() {
    let isMounted = true;

    const init = async () => {
      const startTime = Date.now();

      try {
        const initialUrl = await Linking.getInitialURL();
        const redirectType = await consumeAuthRedirect(initialUrl);
        if (isMounted) {
          await syncHydratedAuthState(redirectType === 'passwordRecovery');
        }
      } catch {
      } finally {
        const elapsed = Date.now() - startTime;
        if (elapsed < MIN_LOADING_DURATION_MS) {
          await delay(MIN_LOADING_DURATION_MS - elapsed);
        }
        if (isMounted) {
          useAuthStore.getState().setLoading(false);
        }
      }
    };
    void init();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(function subscribeToAuthLinks() {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      void consumeAuthRedirect(url).then((redirectType) => {
        if (redirectType === null) {
          return;
        }

        if (redirectType === 'passwordRecovery') {
          useAuthStore.getState().beginPasswordRecovery();
          return;
        }

        void syncHydratedAuthState(false);
      });
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(
    function syncSocketConnectionWithAuth() {
      if (user && !passwordRecoveryPending) {
        SocketService.connect();
        LoggingService.setUser({ id: user.id, username: user.name });
      } else {
        SocketService.disconnect();
        LoggingService.setUser(null);
      }
    },
    [passwordRecoveryPending, user]
  );

  return <>{children}</>;
};
