import { useEffect } from 'react';

import type { GameHistoryFilters } from '@shedding-game/shared';
import { useQueryClient } from '@tanstack/react-query';

import { roomKeys, statsKeys, useGamesQuery } from '@/api';
import type { GamesScope } from '@/api/rooms/rooms.queries';
import { SocketService } from '@/services/SocketService';

export const useGameStatistics = (scope: GamesScope, filters: GameHistoryFilters) => {
  const queryClient = useQueryClient();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetching,
    isFetchingNextPage,
    isLoading,
    isRefetching,
    refetch,
  } = useGamesQuery(scope, filters);

  const games = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;

  const refreshing = isRefetching && !isLoading && !isFetchingNextPage;

  const refreshGames = async () => {
    await refetch();
  };

  useEffect(
    function subscribeToGameStatisticsInvalidation() {
      const invalidateGameStatistics = () => {
        void Promise.all([
          queryClient.invalidateQueries({ queryKey: roomKeys.games() }),
          queryClient.invalidateQueries({ queryKey: statsKeys.all }),
        ]);
      };

      SocketService.on('rooms_updated', invalidateGameStatistics);
      SocketService.on('connect', invalidateGameStatistics);

      return () => {
        SocketService.off('rooms_updated', invalidateGameStatistics);
        SocketService.off('connect', invalidateGameStatistics);
      };
    },
    [queryClient]
  );

  return {
    fetchNextPage,
    games,
    hasNextPage,
    isError,
    isFetching,
    isFetchingNextPage,
    isLoading,
    refreshGames,
    refreshing,
    totalCount,
  };
};
