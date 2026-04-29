import { useCallback, useEffect, useRef } from 'react';

import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';

import { roomKeys } from '@/api';
import { SocketService } from '@/services/SocketService';
import type { Room } from '@/types/rooms';

type RefetchResult = Promise<unknown>;

type UseRoomsLiveSyncParams = {
  refetchRooms: () => RefetchResult;
  refetchActiveGame: () => RefetchResult;
};

export function useRoomsLiveSync({ refetchRooms, refetchActiveGame }: UseRoomsLiveSyncParams) {
  const queryClient = useQueryClient();
  const lastSyncRef = useRef(0);

  const syncRooms = useCallback(() => {
    const now = Date.now();
    if (now - lastSyncRef.current < 5000) {
      return;
    }

    lastSyncRef.current = now;
    void refetchRooms();
    void refetchActiveGame();
  }, [refetchActiveGame, refetchRooms]);

  useEffect(
    function subscribeToRoomsLiveUpdates() {
      const handleRoomsUpdate = (data: { rooms: Room[] }) => {
        queryClient.setQueryData(roomKeys.lists(), data.rooms);
      };

      const handleSocketConnect = () => {
        syncRooms();
      };

      SocketService.on('rooms_updated', handleRoomsUpdate);
      SocketService.on('connect', handleSocketConnect);

      return () => {
        SocketService.off('rooms_updated', handleRoomsUpdate);
        SocketService.off('connect', handleSocketConnect);
      };
    },
    [queryClient, syncRooms]
  );

  useFocusEffect(
    useCallback(
      function syncRoomsOnFocus() {
        syncRooms();
      },
      [syncRooms]
    )
  );
}
