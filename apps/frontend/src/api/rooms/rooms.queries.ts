import type { GameHistoryFilters, GameHistoryPage } from '@shedding-game/shared';
import {
  infiniteQueryOptions,
  keepPreviousData,
  queryOptions,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query';

import { RoomsService } from '@/services/RoomsService';

import { selectGameHistoryInfiniteData } from '../gameHistory.selectors';
import { roomKeys } from '../query-keys';

export type GamesScope = 'all' | 'me';
const GAME_HISTORY_PAGE_SIZE = 20;

/**
 * Query options factory for rooms
 * Centralizes query configuration for reuse across components and prefetching
 */
const roomsQueries = {
  list: () =>
    queryOptions({
      queryKey: roomKeys.lists(),
      queryFn: () => RoomsService.getRooms(),
      staleTime: 30 * 1000,
    }),

  detail: (roomId: string) =>
    queryOptions({
      queryKey: roomKeys.detail(roomId),
      queryFn: () => RoomsService.getRoom(roomId),
      enabled: !!roomId,
      staleTime: 30 * 1000,
      placeholderData: keepPreviousData,
    }),

  active: () =>
    queryOptions({
      queryKey: roomKeys.active(),
      queryFn: () => RoomsService.getActiveGame(),
      staleTime: 0, // always stale — real-time game state
    }),

  games: (scope: GamesScope, filters: GameHistoryFilters) =>
    infiniteQueryOptions({
      queryKey: roomKeys.gameList(scope, filters),
      initialPageParam: undefined as string | undefined,
      queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
        scope === 'all'
          ? RoomsService.getAllGames({
              limit: GAME_HISTORY_PAGE_SIZE,
              cursor: pageParam,
              filters,
            })
          : RoomsService.getMyGames({
              limit: GAME_HISTORY_PAGE_SIZE,
              cursor: pageParam,
              filters,
            }),
      getNextPageParam: (lastPage: GameHistoryPage) => lastPage.nextCursor ?? undefined,
      maxPages: 10,
    }),
};

/**
 * Hook to fetch the list of available rooms
 */
export const useRoomsQuery = () => {
  return useQuery(roomsQueries.list());
};

/**
 * Hook to fetch room details by ID
 */
export const useRoomDetailQuery = (roomId: string) => {
  return useQuery(roomsQueries.detail(roomId));
};

/**
 * Hook to fetch the user's active game
 */
export const useActiveGameQuery = () => {
  return useQuery(roomsQueries.active());
};

/**
 * Hook to fetch game statistics list by scope
 */
export const useGamesQuery = (scope: GamesScope, filters: GameHistoryFilters) => {
  return useInfiniteQuery({
    ...roomsQueries.games(scope, filters),
    select: selectGameHistoryInfiniteData,
  });
};
