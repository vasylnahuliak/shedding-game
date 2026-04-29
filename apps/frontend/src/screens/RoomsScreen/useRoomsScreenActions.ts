import { useState } from 'react';

import { useRouter } from 'expo-router';

import { useAppTranslation } from '@/i18n';
import { HTTPError } from '@/services';
import { analytics } from '@/services/analytics';
import { showAlert, showErrorAlert } from '@/utils/alert';

type JoinRoomMutation = {
  mutateAsync: (roomId: string) => Promise<unknown>;
};

type UseRoomsScreenActionsParams = {
  joinRoomMutation: JoinRoomMutation;
  refetchRooms: () => Promise<unknown>;
  refetchActiveGame: () => Promise<unknown>;
};

export function useRoomsScreenActions({
  joinRoomMutation,
  refetchRooms,
  refetchActiveGame,
}: UseRoomsScreenActionsParams) {
  const { t } = useAppTranslation(['alerts', 'common', 'errors']);
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const refreshRooms = async () => {
    setRefreshing(true);
    await Promise.all([refetchRooms(), refetchActiveGame()]).finally(() => {
      setRefreshing(false);
    });
  };

  const joinRoom = async (roomId: string) => {
    try {
      await joinRoomMutation.mutateAsync(roomId);
      analytics.track('lobby_joined');
      router.push({ pathname: '/lobby', params: { roomId } });
    } catch (error: unknown) {
      const status = error instanceof HTTPError ? error.response.status : undefined;
      if (status === 400) {
        showErrorAlert(t('alerts:titles.roomFull'), t('alerts:messages.roomIsFull'));
      } else if (status === 403 || status === 404) {
        showAlert(t('alerts:titles.roomUnavailable'), t('alerts:messages.roomNoLongerActiveShort'));
        await refetchRooms();
      } else {
        showErrorAlert(t('alerts:titles.error'), t('alerts:messages.roomJoinFailed'));
      }
    }
  };

  const returnToGame = async (roomId: string) => {
    try {
      await joinRoomMutation.mutateAsync(roomId);
      router.push({ pathname: '/game', params: { roomId } });
    } catch {
      // Error handled by mutation
    }
  };

  return {
    refreshing,
    refreshRooms,
    joinRoom,
    returnToGame,
  };
}
