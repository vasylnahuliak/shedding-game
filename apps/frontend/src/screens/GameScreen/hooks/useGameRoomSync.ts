import { useEffect, useEffectEvent, useRef } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { roomKeys } from '@/api';
import { useAppTranslation } from '@/i18n';
import type { BackendMessageLike, RoomClosedPayload } from '@/i18n/backendMessages';
import { getRoomClosedReasonMessage, translateBackendMessage } from '@/i18n/backendMessages';
import { getRoomInactiveNoticeHref } from '@/navigation/roomInactiveNotice';
import { HTTPError } from '@/services';
import { readHttpErrorBody } from '@/services/httpError';
import { RoomsService } from '@/services/RoomsService';
import { SocketService } from '@/services/SocketService';
import type { PlayerKickedEvent, RoomDetails } from '@/types/rooms';
import { showAlert } from '@/utils/alert';

import { getPlayableCardKeys, getPlayerIndex } from './gameSelectors';
import { getRoundStartAnimationToken } from './roundStartAnimation.utils';
import { TOTAL_SHUFFLE_DURATION } from './useDeckShuffleAnimation';

type UseGameRoomSyncParams = {
  roomId: string | undefined;
  room: RoomDetails | null;
  isAuthLoading: boolean;
  userId: string | undefined;
  setRoom: (room: RoomDetails) => void;
  clearSelectedCards: () => void;
  setPendingBridgeJack: (isPending: boolean) => void;
  resetBridgeSuppression: () => void;
  startRoundStartAnimation: (room: RoomDetails, playableKeys?: Set<string>) => void;
  startReshuffleAnimation: () => Promise<void>;
  stopRoundStartAnimation: () => void;
  resetCardAnimations: () => void;
  handleRoomUpdateForAnimation: (
    prevRoom: RoomDetails | null,
    updatedRoom: RoomDetails,
    userId: string | undefined,
    playableKeys?: Set<string>,
    options?: { delay?: number }
  ) => void;
};

export function useGameRoomSync({
  roomId,
  room,
  isAuthLoading,
  userId,
  setRoom,
  clearSelectedCards,
  setPendingBridgeJack,
  resetBridgeSuppression,
  startRoundStartAnimation,
  startReshuffleAnimation,
  stopRoundStartAnimation,
  resetCardAnimations,
  handleRoomUpdateForAnimation,
}: UseGameRoomSyncParams) {
  const { t } = useAppTranslation(['alerts', 'common']);
  const router = useRouter();
  const queryClient = useQueryClient();
  const lastRoundStartAnimationTokenRef = useRef<string | null>(null);
  const prevReshuffleCountRef = useRef<number>(0);

  const redirectToRoomsWithInactiveNotice = useEffectEvent((detail?: string) => {
    router.replace(getRoomInactiveNoticeHref(detail));
  });

  const goHome = useEffectEvent(() => {
    router.replace('/');
  });

  const showHomeAlert = useEffectEvent((title: string, message: string) => {
    showAlert(title, message, [
      {
        text: t('common:buttons.ok'),
        onPress: () => {
          goHome();
        },
      },
    ]);
  });

  const onConnect = useEffectEvent(() => {
    if (!roomId) return;
    SocketService.emit('join_room', { roomId });
  });

  const onRoomUpdate = useEffectEvent((updatedRoom: RoomDetails) => {
    if (updatedRoom.id !== roomId) return;
    if (updatedRoom.gameStatus === 'waiting') {
      router.replace({ pathname: '/lobby', params: { roomId: updatedRoom.id } });
      return;
    }

    const isRoundStartingTransition =
      room?.gameStatus !== 'playing' && updatedRoom.gameStatus === 'playing';
    const roundStartToken = getRoundStartAnimationToken(updatedRoom);
    const shouldAnimateRoundStart =
      !!roundStartToken &&
      (isRoundStartingTransition || lastRoundStartAnimationTokenRef.current !== roundStartToken);

    const previousMyIdx = getPlayerIndex(room, userId);
    const updatedMyIdx = getPlayerIndex(updatedRoom, userId);
    const wasMyTurn = room?.currentPlayerIndex === previousMyIdx;
    const isNowMyTurn = updatedRoom.currentPlayerIndex === updatedMyIdx;

    if (wasMyTurn && !isNowMyTurn) {
      clearSelectedCards();
      setPendingBridgeJack(false);
    }

    if (!updatedRoom.bridgeAvailable) {
      resetBridgeSuppression();
    }

    const isNewMyTurn = isNowMyTurn && updatedRoom.gameStatus === 'playing';
    const playableKeys =
      isNewMyTurn && updatedMyIdx >= 0 ? getPlayableCardKeys(updatedRoom, updatedMyIdx) : undefined;

    let animateDrawDelay = 0;
    if (shouldAnimateRoundStart) {
      lastRoundStartAnimationTokenRef.current = roundStartToken;
      clearSelectedCards();
      prevReshuffleCountRef.current = updatedRoom.reshuffleCount || 0;
      resetCardAnimations();
      startRoundStartAnimation(updatedRoom, playableKeys);
    } else if (updatedRoom.gameStatus !== 'playing') {
      lastRoundStartAnimationTokenRef.current = null;
      prevReshuffleCountRef.current = 0;
      stopRoundStartAnimation();
      resetCardAnimations();
    } else {
      const newReshuffleCount = updatedRoom.reshuffleCount || 0;
      if (newReshuffleCount > prevReshuffleCountRef.current) {
        prevReshuffleCountRef.current = newReshuffleCount;
        void startReshuffleAnimation();
        animateDrawDelay = TOTAL_SHUFFLE_DURATION;
      }
    }

    if (updatedRoom.gameStatus === 'playing') {
      handleRoomUpdateForAnimation(room, updatedRoom, userId, playableKeys, {
        delay: animateDrawDelay,
      });
    }
    setRoom(updatedRoom);
  });

  const onError = useEffectEvent((payload: unknown) => {
    if (
      payload &&
      typeof payload === 'object' &&
      'code' in payload &&
      payload.code === 'ROOM_ACCESS_DENIED'
    ) {
      showHomeAlert(
        t('alerts:titles.error'),
        translateBackendMessage(payload as BackendMessageLike, t('alerts:titles.accessDenied'))
      );
      return;
    }

    const message =
      typeof payload === 'string'
        ? payload
        : translateBackendMessage(
            payload as BackendMessageLike,
            t('alerts:errorBoundary.fallback')
          );
    showAlert(t('alerts:titles.error'), message);
  });

  const onGameNotice = useEffectEvent((payload: unknown) => {
    const message = translateBackendMessage(
      payload as BackendMessageLike,
      t('alerts:messages.deadlockResolvedFallback')
    );

    showAlert(t('alerts:titles.deadlockResolved'), message);
  });

  const onGameEnded = useEffectEvent(() => {
    const isHost = room?.hostId === userId;

    if (isHost) {
      goHome();
    } else {
      showHomeAlert(t('alerts:titles.gameEnded'), t('alerts:messages.gameEndedByHost'));
    }
  });

  const onRoomClosed = useEffectEvent((payload: RoomClosedPayload) => {
    if (payload.roomId !== roomId) return;

    const reasonText = getRoomClosedReasonMessage(
      payload,
      t('alerts:messages.roomNoLongerActiveShort')
    );

    showHomeAlert(t('alerts:titles.roomClosed'), reasonText);
  });

  const onPlayerLeftGame = useEffectEvent(() => {
    goHome();
  });

  const onPlayerKicked = useEffectEvent(({ roomId: kickedRoomId, reason }: PlayerKickedEvent) => {
    if (kickedRoomId !== roomId) return;

    queryClient.removeQueries({ queryKey: roomKeys.detail(kickedRoomId), exact: true });
    queryClient.setQueryData(roomKeys.active(), null);
    void queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
    router.replace('/');

    showAlert(
      t('alerts:titles.youWereKicked'),
      reason === 'timeout'
        ? t('alerts:messages.kickedByTurnTimeout')
        : t('alerts:messages.kickedByHost')
    );
  });

  const onRoomRecreated = useEffectEvent(({ roomId: newRoomId }: { roomId: string }) => {
    queryClient.removeQueries({ queryKey: roomKeys.detail(newRoomId), exact: true });
    router.replace({ pathname: '/lobby', params: { roomId: newRoomId } });
  });

  useEffect(
    function loadInitialGameRoomState() {
      if (!roomId || isAuthLoading) return;

      let cancelled = false;
      RoomsService.getRoom(roomId)
        .then((data) => {
          if (cancelled) return;
          if (data.gameStatus === 'waiting') {
            router.replace({ pathname: '/lobby', params: { roomId: data.id } });
            return;
          }

          setRoom(data);
          prevReshuffleCountRef.current = data.reshuffleCount || 0;
          const initialRoundStartToken = getRoundStartAnimationToken(data);
          if (initialRoundStartToken) {
            lastRoundStartAnimationTokenRef.current = initialRoundStartToken;
            const myIdx = getPlayerIndex(data, userId);
            const isMyTurn = data.currentPlayerIndex === myIdx;
            const playableKeys =
              isMyTurn && myIdx >= 0 ? getPlayableCardKeys(data, myIdx) : undefined;

            clearSelectedCards();
            startRoundStartAnimation(data, playableKeys);
          }
          SocketService.emit('join_room', { roomId });
        })
        .catch(async (error: unknown) => {
          if (cancelled) return;
          if (
            error instanceof HTTPError &&
            (error.response.status === 403 || error.response.status === 404)
          ) {
            if (error.response.status === 403) {
              const body = await readHttpErrorBody<{ leaveReason?: string }>(error);
              if (body?.leaveReason === 'timeout') {
                showHomeAlert(
                  t('alerts:titles.youWereKicked'),
                  t('alerts:messages.kickedByTurnTimeout')
                );
                return;
              }
            }
            redirectToRoomsWithInactiveNotice();
            return;
          }

          if (error instanceof HTTPError && error.response.status === 410) {
            redirectToRoomsWithInactiveNotice(t('alerts:messages.roomNoLongerActiveShort'));
            return;
          }

          if (error instanceof HTTPError && error.response.status === 401) {
            showHomeAlert(t('alerts:titles.accessDenied'), t('alerts:messages.gameAccessDenied'));
          } else {
            goHome();
          }
        });

      return () => {
        cancelled = true;
      };
    },
    [
      clearSelectedCards,
      isAuthLoading,
      roomId,
      router,
      setRoom,
      startRoundStartAnimation,
      t,
      userId,
    ]
  );

  useEffect(
    function subscribeToGameRoomEvents() {
      if (!roomId || isAuthLoading) return;

      SocketService.on('connect', onConnect);
      SocketService.on('room_updated', onRoomUpdate);
      SocketService.on('error', onError);
      SocketService.on('game_notice', onGameNotice);
      SocketService.on('game_ended', onGameEnded);
      SocketService.on('room_closed', onRoomClosed);
      SocketService.on('player_left_game', onPlayerLeftGame);
      SocketService.on('player_kicked', onPlayerKicked);
      SocketService.on('room_recreated', onRoomRecreated);

      return () => {
        SocketService.off('connect', onConnect);
        SocketService.off('room_updated', onRoomUpdate);
        SocketService.off('error', onError);
        SocketService.off('game_notice', onGameNotice);
        SocketService.off('game_ended', onGameEnded);
        SocketService.off('room_closed', onRoomClosed);
        SocketService.off('player_left_game', onPlayerLeftGame);
        SocketService.off('player_kicked', onPlayerKicked);
        SocketService.off('room_recreated', onRoomRecreated);
        stopRoundStartAnimation();
        resetCardAnimations();
      };
    },
    [isAuthLoading, resetCardAnimations, roomId, stopRoundStartAnimation]
  );
}
