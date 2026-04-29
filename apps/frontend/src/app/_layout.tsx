// eslint-disable-next-line
import '../../global.css';

import { KeyboardProvider } from 'react-native-keyboard-controller';

import { QueryClientProvider, useQueryErrorResetBoundary } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { queryClient } from '@/api';
import { AlertProvider, AlertViewport } from '@/components/AlertProvider';
import { AuthProvider } from '@/components/AuthProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SmlerDeepLinkProvider } from '@/components/SmlerDeepLinkProvider';
import {
  fadeTransparentModalScreenOptions,
  TransparentStackLayout,
} from '@/components/TransparentStackLayout/TransparentStackLayout';
import { StyledGestureHandlerRootView } from '@/components/ui/interop';
import { AppThemeProvider } from '@/components/ui/theme-provider';
import { useTanStackQueryFocusManager, useTanStackQueryOnlineManager } from '@/hooks';
import { useAuth } from '@/hooks/useAuthStore';
import { AnalyticsRouteTracker } from '@/monitoring/analytics';
import { SentryRouteTracker } from '@/monitoring/sentry';
import { AuthScreen } from '@/screens/AuthScreen/AuthScreen';
import { LoadingScreen } from '@/screens/LoadingScreen';
import { SafeAreaListenerComponent } from '@/components/SafeAreaListenerComponent';

import '@/i18n';

function QueryAwareErrorBoundary({ children }: { children: React.ReactNode }) {
  const { reset } = useQueryErrorResetBoundary();
  return <ErrorBoundary onReset={reset}>{children}</ErrorBoundary>;
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuth((state) => Boolean(state.user));
  const isLoading = useAuth((state) => state.isLoading);
  const passwordRecoveryPending = useAuth((state) => state.passwordRecoveryPending);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated || passwordRecoveryPending) {
    return <AuthScreen />;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  useTanStackQueryFocusManager();
  useTanStackQueryOnlineManager();

  return (
    <StyledGestureHandlerRootView className="flex-1">
      <SafeAreaListenerComponent>
        <AppThemeProvider mode="dark">
          <KeyboardProvider>
            <ErrorBoundary>
              <QueryClientProvider client={queryClient}>
                <QueryAwareErrorBoundary>
                  <AlertProvider>
                    <AuthProvider>
                      <SmlerDeepLinkProvider />
                      <AnalyticsRouteTracker />
                      <SentryRouteTracker />
                      <StatusBar style="light" />
                      <AuthGate>
                        <TransparentStackLayout>
                          <Stack.Screen name="index" />
                          <Stack.Screen name="profile" />
                          <Stack.Screen name="profile-stats" />
                          <Stack.Screen name="profile-settings" />
                          <Stack.Screen name="lobby" />
                          <Stack.Screen
                            name="game"
                            options={{
                              gestureEnabled: false,
                            }}
                          />
                          <Stack.Screen name="admin" />
                          <Stack.Screen
                            name="emoji-picker"
                            options={fadeTransparentModalScreenOptions}
                          />
                        </TransparentStackLayout>
                        <AlertViewport />
                      </AuthGate>
                    </AuthProvider>
                  </AlertProvider>
                </QueryAwareErrorBoundary>
              </QueryClientProvider>
            </ErrorBoundary>
          </KeyboardProvider>
        </AppThemeProvider>
      </SafeAreaListenerComponent>
    </StyledGestureHandlerRootView>
  );
}
