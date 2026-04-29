import { useEffect } from 'react';
import type { AppStateStatus } from 'react-native';
import { AppState } from 'react-native';

import { focusManager } from '@tanstack/react-query';

export const useTanStackQueryFocusManager = () => {
  useEffect(function syncTanStackQueryFocusState() {
    return focusManager.setEventListener((handleFocus) => {
      const onAppStateChange = (status: AppStateStatus) => {
        handleFocus(status === 'active');
      };

      const appStateSubscription = AppState.addEventListener('change', onAppStateChange);
      handleFocus(AppState.currentState === 'active');

      return () => appStateSubscription.remove();
    });
  }, []);
};
