import { useRef } from 'react';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { HTTPError } from 'ky';

import {
  useAddBotMutation,
  useJoinRoomMutation,
  useKickPlayerMutation,
  useLeaveRoomMutation,
  useReorderPlayersMutation,
  useRoomDetailQuery,
  useStartGameMutation,
  useUpdateRoomOptionsMutation,
} from '@/api';
import { useAuth } from '@/hooks/useAuthStore';
import { useAppTranslation } from '@/i18n';
import { getRoomInactiveNoticeHref } from '@/navigation/roomInactiveNotice';
import { LoggingService } from '@/services/LoggingService';
import { SocketService } from '@/services/SocketService';
import { showAlert, showErrorAlert } from '@/utils/alert';

import { getLobbyDerivedState } from './lobbySelectors';
import { useLobbyRoomActions } from './useLobbyRoomActions';
import { useLobbyRoomSync } from './useLobbyRoomSync';

export const useLobby = () => {
  const { t } = useAppTranslation(['alerts', 'common']);
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const user = useAuth((state) => state.user);
  const isAuthLoading = useAuth((state) => state.isLoading);
  const lobbyInactiveRef = useRef(false);

  const {
    data: room,
    isLoading: isRoomLoading,
    refetch: refetchRoom,
    error: roomError,
  } = useRoomDetailQuery(roomId ?? '');

  const joinRoomMutation = useJoinRoomMutation();
  const startGameMutation = useStartGameMutation();
  const addBotMutation = useAddBotMutation();
  const kickPlayerMutation = useKickPlayerMutation();
  const reorderPlayersMutation = useReorderPlayersMutation();
  const leaveRoomMutation = useLeaveRoomMutation();
  const updateRoomOptionsMutation = useUpdateRoomOptionsMutation();

  const loading = isRoomLoading || joinRoomMutation.isPending;

  const { hostId, isHostUser, playerCount, canStartGame, needsMorePlayers, roomIsFull } =
    getLobbyDerivedState(room, user?.id);

  const redirectToRoomsWithInactiveNotice = (detail?: string) => {
    if (lobbyInactiveRef.current) return;
    lobbyInactiveRef.current = true;
    router.replace(getRoomInactiveNoticeHref(detail));
  };

  const goHome = () => {
    if (lobbyInactiveRef.current) return;
    lobbyInactiveRef.current = true;
    router.replace('/');
  };

  const exitLobby = (title: string, message: string) => {
    if (lobbyInactiveRef.current) return;
    showAlert(title, message);
    goHome();
  };

  const goToGame = () => {
    if (lobbyInactiveRef.current || !roomId) return;
    lobbyInactiveRef.current = true;
    router.replace({ pathname: '/game', params: { roomId } });
  };

  const autoJoinWaitingRoom = (targetRoomId: string) => {
    joinRoomMutation.mutate(targetRoomId, {
      onError: (error) => {
        if (error instanceof HTTPError && error.response.status === 400) {
          exitLobby(t('alerts:titles.roomFull'), t('alerts:messages.lobbyRoomFull'));
          return;
        }
        if (
          error instanceof HTTPError &&
          (error.response.status === 403 || error.response.status === 404)
        ) {
          redirectToRoomsWithInactiveNotice();
          return;
        }
        exitLobby(t('alerts:titles.error'), t('alerts:messages.lobbyJoinFailed'));
      },
    });
  };

  const { pauseRoomSync } = useLobbyRoomSync({
    roomId,
    room,
    roomError,
    isAuthLoading,
    isRoomLoading,
    userId: user?.id,
    autoJoinWaitingRoom,
    redirectToRoomsWithInactiveNotice,
    exitLobby,
    goToGame,
  });

  const {
    startGame,
    addBot,
    isAddingBot,
    kickPlayer,
    reorderPlayers,
    refreshRoom,
    updateRoomOptions,
  } = useLobbyRoomActions({
    roomId,
    playerCount,
    canStartGame,
    goToGame,
    startGameMutation,
    addBotMutation,
    kickPlayerMutation,
    reorderPlayersMutation,
    updateRoomOptionsMutation,
    refetchRoom,
  });

  const leaveRoom = () => {
    if (!roomId) return;

    const title = isHostUser
      ? t('alerts:titles.closeRoomConfirm')
      : t('alerts:titles.leaveRoomConfirm');
    const message = isHostUser
      ? t('alerts:messages.closeRoomConfirm')
      : t('alerts:messages.leaveRoomConfirm');

    showAlert(title, message, [
      { text: t('common:buttons.cancel'), style: 'cancel' },
      {
        text: isHostUser ? t('alerts:actions.close') : t('alerts:actions.leave'),
        style: 'destructive',
        onPress: async () => {
          try {
            pauseRoomSync();
            SocketService.emit('leave_room', { roomId });
            await leaveRoomMutation.mutateAsync(roomId);
            goHome();
          } catch (e) {
            LoggingService.error('Failed to leave room', e, { roomId });
            showErrorAlert(t('alerts:titles.error'), t('alerts:messages.roomLeaveFailed'));
          }
        },
      },
    ]);
  };

  return {
    roomId,
    room: room ?? null,
    hostId,
    loading,
    isHostUser,
    playerCount,
    canStartGame,
    needsMorePlayers,
    roomIsFull,
    isAddingBot,
    startGame,
    addBot,
    kickPlayer,
    leaveRoom,
    reorderPlayers,
    refreshRoom,
    updateRoomOptions,
  };
};
