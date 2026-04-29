import type { BotPersonaName, DebugMode, GamePace } from '@shedding-game/shared';
import type { QueryClient } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { LoggingService } from '@/services/LoggingService';
import { RoomsService } from '@/services/RoomsService';
import type { ActiveGame, RoomDetails } from '@/types/rooms';

import { roomKeys } from '../query-keys';

const setRoomDetailCache = (queryClient: QueryClient, room: RoomDetails) => {
  queryClient.setQueryData(roomKeys.detail(room.id), room);
};

const setActiveGameCache = (queryClient: QueryClient, room: RoomDetails) => {
  const activeGame: ActiveGame = {
    id: room.id,
    name: room.name,
    gameStatus: room.gameStatus,
    playersCount: room.players.length,
  };
  queryClient.setQueryData(roomKeys.active(), activeGame);
};

const invalidateRoomLists = (queryClient: QueryClient) => {
  return queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
};

const invalidateActiveGame = (queryClient: QueryClient) => {
  return queryClient.invalidateQueries({ queryKey: roomKeys.active() });
};

type RoomMutationCacheOptions = {
  invalidateLists?: boolean;
  invalidateActiveGame?: boolean;
  setActiveGame?: boolean;
};

const syncRoomMutationCaches = async (
  queryClient: QueryClient,
  room: RoomDetails,
  options?: RoomMutationCacheOptions
) => {
  setRoomDetailCache(queryClient, room);

  if (options?.setActiveGame) {
    setActiveGameCache(queryClient, room);
  }

  const promises: Promise<void>[] = [];

  if (options?.invalidateLists) {
    promises.push(invalidateRoomLists(queryClient));
  }

  if (options?.invalidateActiveGame) {
    promises.push(invalidateActiveGame(queryClient));
  }

  await Promise.all(promises);
};

/**
 * Hook to create a new room
 */
export const useCreateRoomMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      name,
      debugMode,
      gamePace,
    }: {
      name: string;
      debugMode?: DebugMode;
      gamePace?: GamePace;
    }) => RoomsService.createRoom(name, debugMode, gamePace),
    onSuccess: (room) => syncRoomMutationCaches(queryClient, room, { invalidateLists: true }),
  });
};

/**
 * Hook to join a room
 */
export const useJoinRoomMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roomId: string) => RoomsService.joinRoom(roomId),
    onSuccess: (room) =>
      syncRoomMutationCaches(queryClient, room, {
        invalidateLists: true,
        invalidateActiveGame: true,
      }),
  });
};

/**
 * Hook to leave a room
 */
export const useLeaveRoomMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roomId: string) => RoomsService.leaveRoom(roomId),
    onSuccess: (_data, roomId) => {
      queryClient.removeQueries({ queryKey: roomKeys.detail(roomId), exact: true });
      return Promise.all([invalidateRoomLists(queryClient), invalidateActiveGame(queryClient)]);
    },
  });
};

/**
 * Hook to create a short invite link for a room
 */
export const useRoomInviteLinkMutation = () => {
  return useMutation({
    mutationFn: (roomId: string) => RoomsService.getInviteLink(roomId),
    onError: (error) => {
      LoggingService.error('Failed to generate invite link', error);
    },
  });
};

/**
 * Hook to start a game in a room
 */
export const useStartGameMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roomId: string) => RoomsService.startGame(roomId),
    onSuccess: (room) =>
      syncRoomMutationCaches(queryClient, room, {
        invalidateLists: true,
        setActiveGame: true,
      }),
  });
};

/**
 * Hook to add a bot to a room
 */
export const useAddBotMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roomId: string) => RoomsService.addBot(roomId),
    onSuccess: (room) => syncRoomMutationCaches(queryClient, room, { invalidateLists: true }),
    onError: (error) => {
      LoggingService.error('Failed to add bot', error);
    },
  });
};

export const useUpdateBotNameMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      roomId,
      botId,
      name,
    }: {
      roomId: string;
      botId: string;
      name: BotPersonaName;
    }) => RoomsService.updateBotName(roomId, botId, name),
    onSuccess: (room) => {
      setRoomDetailCache(queryClient, room);
    },
    onError: (error) => {
      LoggingService.error('Failed to update bot name', error);
    },
  });
};

/**
 * Hook to kick a player from a room
 */
export const useKickPlayerMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roomId, playerId }: { roomId: string; playerId: string }) =>
      RoomsService.kickPlayer(roomId, playerId),
    onSuccess: (room) => syncRoomMutationCaches(queryClient, room, { invalidateLists: true }),
    onError: (error) => {
      LoggingService.error('Failed to kick player', error);
    },
  });
};

/**
 * Hook to reorder players in a room
 */
export const useReorderPlayersMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roomId, playerIds }: { roomId: string; playerIds: string[] }) =>
      RoomsService.reorderPlayers(roomId, playerIds),
    onSuccess: (room) => {
      setRoomDetailCache(queryClient, room);
    },
    onError: (error) => {
      LoggingService.error('Failed to reorder players', error);
    },
  });
};

/**
 * Hook to update room options
 */
export const useUpdateRoomOptionsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      roomId,
      name,
      debugMode,
      gamePace,
    }: {
      roomId: string;
      name?: string;
      debugMode?: DebugMode;
      gamePace?: GamePace;
    }) => RoomsService.updateRoomOptions(roomId, name, debugMode, gamePace),
    onSuccess: (room) => syncRoomMutationCaches(queryClient, room, { invalidateLists: true }),
    onError: (error) => {
      LoggingService.error('Failed to update room options', error);
    },
  });
};
