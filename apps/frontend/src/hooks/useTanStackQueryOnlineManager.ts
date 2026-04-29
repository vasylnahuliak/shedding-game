import { useEffect } from 'react';

import { onlineManager } from '@tanstack/react-query';
import { useNetworkState } from 'expo-network';

export const useTanStackQueryOnlineManager = () => {
  const networkState = useNetworkState();

  useEffect(
    function syncTanStackQueryOnlineStatus() {
      onlineManager.setOnline(networkState.isConnected ?? false);
    },
    [networkState.isConnected]
  );
};
