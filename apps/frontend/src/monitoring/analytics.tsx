import { useEffect } from 'react';

import { usePathname } from 'expo-router';

import { normalizeTrackedPathname } from '@/navigation/appRoutes';
import { analytics } from '@/services/analytics';

export const AnalyticsRouteTracker = () => {
  const pathname = usePathname();
  const trackedPathname = normalizeTrackedPathname(pathname);

  useEffect(function initializeAnalytics() {
    analytics.init();
  }, []);

  useEffect(
    function trackAnalyticsRoute() {
      analytics.trackScreen(trackedPathname);
    },
    [trackedPathname]
  );

  return null;
};
