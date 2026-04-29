import { useEffect } from 'react';
import { Platform } from 'react-native';

import * as Sentry from '@sentry/react-native';
import { usePathname } from 'expo-router';
import * as Updates from 'expo-updates';

import { APP_ENV, SENTRY_DSN_MOBILE } from '@/config';
import { normalizeTrackedPathname } from '@/navigation/appRoutes';

type ExpoManifestMetadata = {
  updateGroup?: unknown;
};

type ExpoManifestExtra = {
  expoClient?: {
    owner?: unknown;
    slug?: unknown;
  };
};

const APP_SURFACE = 'mobile';
const SENTRY_DSN = SENTRY_DSN_MOBILE;
const IS_METRO_DEV_SERVER = process.env.___SENTRY_METRO_DEV_SERVER___ === 'true';
const SHOULD_INIT_SENTRY =
  !__DEV__ && APP_ENV !== 'local' && !IS_METRO_DEV_SERVER && Boolean(SENTRY_DSN);

let sentryEnabled = false;

const setExpoUpdateTags = () => {
  const scope = Sentry.getGlobalScope();
  const manifest = Updates.manifest as Partial<{
    metadata: ExpoManifestMetadata;
    extra: ExpoManifestExtra;
  }>;
  const updateGroup =
    manifest.metadata && typeof manifest.metadata.updateGroup === 'string'
      ? manifest.metadata.updateGroup
      : undefined;
  const owner =
    manifest.extra?.expoClient && typeof manifest.extra.expoClient.owner === 'string'
      ? manifest.extra.expoClient.owner
      : undefined;
  const slug =
    manifest.extra?.expoClient && typeof manifest.extra.expoClient.slug === 'string'
      ? manifest.extra.expoClient.slug
      : undefined;

  if (typeof Updates.updateId === 'string') {
    scope.setTag('expo-update-id', Updates.updateId);
  }

  scope.setTag('expo-is-embedded-update', String(Updates.isEmbeddedLaunch));

  if (updateGroup) {
    scope.setTag('expo-update-group-id', updateGroup);

    if (owner && slug) {
      scope.setTag(
        'expo-update-debug-url',
        `https://expo.dev/accounts/${owner}/projects/${slug}/updates/${updateGroup}`
      );
    }
  } else if (Updates.isEmbeddedLaunch) {
    scope.setTag('expo-update-debug-url', 'not applicable for embedded updates');
  }
};

const initializeSentry = () => {
  if (sentryEnabled || !SHOULD_INIT_SENTRY || !SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: APP_ENV,
    attachStacktrace: true,
  });

  const scope = Sentry.getGlobalScope();
  scope.setTags({
    app_env: APP_ENV,
    app_surface: APP_SURFACE,
    platform_os: Platform.OS,
  });

  setExpoUpdateTags();

  sentryEnabled = true;
};

initializeSentry();

export const isSentryEnabled = () => sentryEnabled;

const setSentryRoute = (pathname: string) => {
  if (!sentryEnabled || !pathname) {
    return;
  }

  Sentry.setTag('route', pathname);
};

export const SentryRouteTracker = () => {
  const pathname = usePathname();
  const trackedPathname = normalizeTrackedPathname(pathname);

  useEffect(
    function syncSentryRoute() {
      setSentryRoute(trackedPathname);
    },
    [trackedPathname]
  );

  return null;
};
