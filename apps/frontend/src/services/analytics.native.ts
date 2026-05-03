import { init, trackEvent } from '@aptabase/react-native';

import { createAnalyticsClient } from './analytics.shared';

export const analytics = createAnalyticsClient({
  initialize: (appKey) => init(appKey),
  trackEvent: (eventName, props) => trackEvent(eventName, props),
});

export type { AnalyticsEventName, AnalyticsProps } from './analytics.shared';
