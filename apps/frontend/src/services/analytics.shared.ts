import Constants from 'expo-constants';

import { APP_ENV, APTABASE_APP_KEY } from '@/config';

type AnalyticsPrimitive = string | number | boolean | null;

export type AnalyticsEventName =
  | 'app_opened'
  | 'screen_view'
  | 'auth_completed'
  | 'auth_method_selected'
  | 'email_link_requested'
  | 'lobby_created'
  | 'lobby_joined'
  | 'game_started'
  | 'game_finished'
  | 'password_fallback_opened'
  | 'profile_opened';

export type AnalyticsProps = Record<string, AnalyticsPrimitive | undefined>;
type SanitizedAnalyticsProps = Record<string, string | number> | undefined;

type AnalyticsAdapter = {
  initialize: (appKey: string, appVersion?: string) => void | Promise<void>;
  trackEvent: (
    eventName: AnalyticsEventName,
    props?: SanitizedAnalyticsProps
  ) => void | Promise<void>;
};

const ANALYTICS_APP_KEY = APTABASE_APP_KEY;
const ANALYTICS_APP_VERSION = Constants.expoConfig?.version;
const ANALYTICS_ENABLED = !__DEV__ && APP_ENV !== 'local' && Boolean(ANALYTICS_APP_KEY);

const sanitizeAnalyticsProps = (props?: AnalyticsProps) => {
  if (!props) {
    return undefined;
  }

  const sanitizedEntries = Object.entries(props).flatMap(([key, value]) => {
    if (value === undefined) {
      return [];
    }

    if (typeof value === 'number' || typeof value === 'string') {
      return [[key, value] as const];
    }

    if (typeof value === 'boolean') {
      return [[key, value ? 'true' : 'false'] as const];
    }

    return [[key, 'null'] as const];
  });

  if (sanitizedEntries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(sanitizedEntries);
};

const fireAndForget = (work: void | Promise<void>) => {
  void Promise.resolve(work);
};

export const createAnalyticsClient = (adapter: AnalyticsAdapter) => {
  let analyticsInitialized = false;

  return {
    init: () => {
      if (analyticsInitialized || !ANALYTICS_ENABLED || !ANALYTICS_APP_KEY) {
        return;
      }

      fireAndForget(adapter.initialize(ANALYTICS_APP_KEY, ANALYTICS_APP_VERSION));
      analyticsInitialized = true;
      fireAndForget(adapter.trackEvent('app_opened'));
    },
    track: (eventName: AnalyticsEventName, props?: AnalyticsProps) => {
      if (!analyticsInitialized) {
        return;
      }

      fireAndForget(adapter.trackEvent(eventName, sanitizeAnalyticsProps(props)));
    },
    trackScreen: (pathname: string) => {
      if (!pathname) {
        return;
      }

      fireAndForget(adapter.trackEvent('screen_view', { path: pathname }));
    },
  };
};
