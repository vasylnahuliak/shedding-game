import { useCallback } from 'react';

import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';

export const useModalDismiss = (fallbackHref: Href) => {
  const router = useRouter();

  return useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(fallbackHref);
  }, [fallbackHref, router]);
};
