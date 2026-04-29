import { useEffect, useEffectEvent, useRef } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { HTTPError } from 'ky';

import { roomKeys } from '@/api';
import { useAppTranslation } from '@/i18n';
import type { BackendMessageLike, RoomClosedPayload } from '@/i18n/backendMessages';
import { getRoomClosedReasonMessage, translateBackendMessage } from '@/i18n/backendMessages';
import { SocketService } from '@/services/SocketService';
import type { PlayerKickedEvent, RoomDetails } from '@/types/rooms';
import { showAlert } from '@/utils/alert';

type UseLobbyRoomSyncParams = {
  roomId: string | undefined;
  room: RoomDetails | null | undefined;
  roomError: unknown;
  isAuthLoading: boolean;
  isRoomLoading: boolean;
  userId: string | undefined;
  autoJoinWaitingRoom: (roomId: string) => void;
  redirectToRoomsWithInactiveNotice: (detail?: string) => void;
  exitLobby: (title: string, message: string) => void;
  goToGame: () => void;
};

export function useLobbyRoomSync({
  roomId,
  room,
  roomError,
  isAuthLoading,
  isRoomLoading,
  userId,
  autoJoinWaitingRoom,
  redirectToRoomsWithInactiveNotice,
  exitLobby,
  goToGame,
}: UseLobbyRoomSyncParams) {
  const { t } = useAppTranslation(['alerts']);
  const queryClient = useQueryClient();
  const hasAttemptedAutoJoinRef = useRef(false);
  const isRoomSyncPausedRef = useRef(false);
  const handleAutoJoinWaitingRoom = useEffectEvent((targetRoomId: string) => {
    autoJoinWaitingRoom(targetRoomId);
  });
  const handleRedirectToRoomsWithInactiveNotice = useEffectEvent((detail?: string) => {
    redirectToRoomsWithInactiveNotice(detail);
  });
  const handleExitLobby = useEffectEvent((title: string, message: string) => {
    exitLobby(title, message);
  });
  const handleGoToGame = useEffectEvent(() => {
    goToGame();
  });

  useEffect(
    function resetLobbyRoomSyncState() {
      hasAttemptedAutoJoinRef.current = false;
      isRoomSyncPausedRef.current = false;
    },
    [roomId]
  );

  useEffect(
    function syncLobbyMembershipState() {
      if (!roomId || isAuthLoading || !userId || isRoomLoading || hasAttemptedAutoJoinRef.current) {
        return;
      }
      if (!room) return;

      // eslint-disable-next-line react-you-might-not-need-an-effect/no-pass-data-to-parent -- local computation, not passing data to a parent callback
      const isUserInRoom = room.players.some((player) => player.id === userId);
      if (isUserInRoom) return;

      hasAttemptedAutoJoinRef.current = true;

      if (room.gameStatus === 'waiting') {
        // eslint-disable-next-line react-you-might-not-need-an-effect/no-pass-data-to-parent -- useEffectEvent-wrapped navigation action, not a data-passing anti-pattern
        handleAutoJoinWaitingRoom(roomId);
        return;
      }

      // eslint-disable-next-line react-you-might-not-need-an-effect/no-pass-data-to-parent -- same as above
      handleRedirectToRoomsWithInactiveNotice();
    },
    [isAuthLoading, isRoomLoading, room, roomId, userId]
  );

  useEffect(
    function handleLobbyRoomError() {
      if (!roomError) return;
      if (
        roomError instanceof HTTPError &&
        (roomError.response.status === 403 || roomError.response.status === 404)
      ) {
        // eslint-disable-next-line react-you-might-not-need-an-effect/no-pass-data-to-parent -- useEffectEvent-wrapped navigation action, not a data-passing anti-pattern
        handleRedirectToRoomsWithInactiveNotice();
      }
    },
    [roomError]
  );

  useEffect(
    function redirectToGameWhenRoomStarts() {
      if (!isRoomSyncPausedRef.current && room?.gameStatus === 'playing') {
        handleGoToGame();
      }
    },
    [room?.gameStatus]
  );

  const onRoomUpdate = useEffectEvent((updatedRoom: RoomDetails) => {
    if (isRoomSyncPausedRef.current || updatedRoom.id !== roomId) {
      return;
    }

    queryClient.setQueryData(roomKeys.detail(roomId), updatedRoom);
  });

  const onRoomClosed = useEffectEvent((payload: RoomClosedPayload) => {
    if (isRoomSyncPausedRef.current || payload.roomId !== roomId) {
      return;
    }

    const reasonText = getRoomClosedReasonMessage(
      payload,
      t('alerts:messages.roomNoLongerActiveLong')
    );
    handleRedirectToRoomsWithInactiveNotice(reasonText);
  });

  const onPlayerKicked = useEffectEvent(({ roomId: kickedRoomId, reason }: PlayerKickedEvent) => {
    if (isRoomSyncPausedRef.current || kickedRoomId !== roomId) {
      return;
    }

    handleExitLobby(
      t('alerts:titles.youWereKicked'),
      reason === 'timeout'
        ? t('alerts:messages.kickedByTurnTimeout')
        : t('alerts:messages.kickedByHost')
    );
  });

  const onGameNotice = useEffectEvent((payload: unknown) => {
    if (isRoomSyncPausedRef.current) {
      return;
    }

    const message = translateBackendMessage(
      payload as BackendMessageLike,
      t('alerts:messages.deadlockResolvedFallback')
    );

    showAlert(t('alerts:titles.deadlockResolved'), message);
  });

  const onConnect = useEffectEvent(() => {
    if (isRoomSyncPausedRef.current || !roomId) return;
    SocketService.emit('join_room', { roomId });
  });

  useEffect(
    function subscribeToLobbyRoomEvents() {
      if (!roomId || isAuthLoading) return;

      onConnect();
      SocketService.on('connect', onConnect);
      SocketService.on('room_updated', onRoomUpdate);
      SocketService.on('room_closed', onRoomClosed);
      SocketService.on('player_kicked', onPlayerKicked);
      SocketService.on('game_notice', onGameNotice);

      return () => {
        SocketService.off('connect', onConnect);
        SocketService.off('room_updated', onRoomUpdate);
        SocketService.off('room_closed', onRoomClosed);
        SocketService.off('player_kicked', onPlayerKicked);
        SocketService.off('game_notice', onGameNotice);
      };
    },
    [isAuthLoading, roomId]
  );

  const pauseRoomSync = () => {
    isRoomSyncPausedRef.current = true;
  };

  return {
    pauseRoomSync,
  };
}
