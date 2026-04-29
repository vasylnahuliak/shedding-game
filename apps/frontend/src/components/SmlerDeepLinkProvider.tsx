import { useEffect, useEffectEvent, useRef } from 'react';

import * as Linking from 'expo-linking';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';

import { LoggingService } from '@/services/LoggingService';
import {
  resolveDeferredSmlerLinkOnFirstLaunch,
  resolveIncomingSmlerLink,
  trackDeferredSmlerConversion,
} from '@/services/SmlerService';

export const SmlerDeepLinkProvider = () => {
  const router = useRouter();
  const isMountedRef = useRef(true);

  const navigateToHref = useEffectEvent((href: Href) => {
    if (!isMountedRef.current) {
      return;
    }

    router.replace(href);
  });

  const handleIncomingUrl = useEffectEvent(async (url: string | null | undefined) => {
    try {
      const resolvedLink = await resolveIncomingSmlerLink(url);
      if (!resolvedLink) {
        return false;
      }

      navigateToHref(resolvedLink.href);
      return true;
    } catch (error) {
      LoggingService.warn('Failed to resolve incoming Smler link', {
        url,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  });

  const handleDeferredLink = useEffectEvent(async () => {
    try {
      const resolvedLink = await resolveDeferredSmlerLinkOnFirstLaunch();
      if (!resolvedLink) {
        return;
      }

      navigateToHref(resolvedLink.href);
      await trackDeferredSmlerConversion(resolvedLink.sourceLink);
    } catch (error) {
      LoggingService.warn('Failed to resolve deferred Smler deep link', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  useEffect(function initializeDeepLinksAndSubscribeToIncomingLinks() {
    isMountedRef.current = true;

    const init = async () => {
      const initialUrl = await Linking.getInitialURL();
      const handledIncomingUrl = await handleIncomingUrl(initialUrl);

      if (!handledIncomingUrl) {
        await handleDeferredLink();
      }
    };

    void init();

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void handleIncomingUrl(url);
    });

    return () => {
      isMountedRef.current = false;
      subscription.remove();
    };
  }, []);

  return null;
};
