import { useCallback, useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { type DebugMode, type GamePace, MAX_PLAYERS } from '@shedding-game/shared';

import { roomKeys } from '@/api';
import { analytics } from '@/services/analytics';
import { LoggingService } from '@/services/LoggingService';
import type { RoomDetails } from '@/types/rooms';

type RoomIdMutation = {
  mutateAsync: (roomId: string) => Promise<unknown>;
};

type PendingRoomIdMutation = RoomIdMutation & {
  isPending: boolean;
};

type KickPlayerMutation = {
  mutateAsync: (params: { roomId: string; playerId: string }) => Promise<unknown>;
};

type ReorderPlayersMutation = {
  mutateAsync: (params: { roomId: string; playerIds: string[] }) => Promise<unknown>;
};

type UpdateRoomOptionsMutation = {
  mutateAsync: (params: {
    roomId: string;
    name?: string;
    debugMode?: DebugMode;
    gamePace?: GamePace;
  }) => Promise<unknown>;
};

type UseLobbyRoomActionsParams = {
  roomId: string | undefined;
  playerCount: number;
  canStartGame: boolean;
  goToGame: () => void;
  startGameMutation: RoomIdMutation;
  addBotMutation: PendingRoomIdMutation;
  kickPlayerMutation: KickPlayerMutation;
  reorderPlayersMutation: ReorderPlayersMutation;
  updateRoomOptionsMutation: UpdateRoomOptionsMutation;
  refetchRoom: () => Promise<unknown>;
};

export function useLobbyRoomActions({
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
}: UseLobbyRoomActionsParams) {
  const queryClient = useQueryClient();
  const addBotLockRef = useRef(false);
  const [isAddingBotLocally, setIsAddingBotLocally] = useState(false);

  const roomIsFull = playerCount >= MAX_PLAYERS;

  const startGame = async () => {
    if (!roomId || !canStartGame) return;
    try {
      await startGameMutation.mutateAsync(roomId);
      analytics.track('game_started');
      goToGame();
    } catch (error) {
      LoggingService.error('Failed to start game', error, { roomId });
    }
  };

  const addBot = async () => {
    if (!roomId || roomIsFull || addBotLockRef.current) return;

    addBotLockRef.current = true;
    setIsAddingBotLocally(true);

    try {
      await addBotMutation.mutateAsync(roomId);
    } catch (error) {
      LoggingService.error('Failed to add bot', error, { roomId });
    } finally {
      addBotLockRef.current = false;
      setIsAddingBotLocally(false);
    }
  };

  const kickPlayer = async (playerId: string) => {
    if (!roomId) return;
    try {
      await kickPlayerMutation.mutateAsync({ roomId, playerId });
    } catch (error) {
      LoggingService.error('Failed to kick player', error, { roomId, playerId });
    }
  };

  const reorderPlayers = async (newPlayers: RoomDetails['players']) => {
    if (!roomId) return;

    queryClient.setQueryData(roomKeys.detail(roomId), (old: RoomDetails | undefined) =>
      old ? { ...old, players: newPlayers } : old
    );

    try {
      await reorderPlayersMutation.mutateAsync({
        roomId,
        playerIds: newPlayers.map((player) => player.id),
      });
    } catch (error) {
      LoggingService.error('Failed to reorder players', error, {
        roomId,
        playerIds: newPlayers.map((player) => player.id),
      });
      await refetchRoom();
    }
  };

  const refreshRoom = useCallback(async () => {
    await refetchRoom();
  }, [refetchRoom]);

  const updateRoomOptions = async (options: {
    name?: string;
    debugMode?: DebugMode;
    gamePace?: GamePace;
  }) => {
    if (!roomId) return;
    try {
      await updateRoomOptionsMutation.mutateAsync({
        roomId,
        ...options,
      });
    } catch (error) {
      LoggingService.error('Failed to update room options', error, {
        roomId,
        options,
      });
    }
  };

  return {
    startGame,
    addBot,
    isAddingBot: isAddingBotLocally || addBotMutation.isPending,
    kickPlayer,
    reorderPlayers,
    refreshRoom,
    updateRoomOptions,
  };
}
