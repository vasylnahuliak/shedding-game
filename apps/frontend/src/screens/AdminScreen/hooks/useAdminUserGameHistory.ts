import type { GameHistoryFilters } from '@shedding-game/shared';

import { useAdminUserGamesQuery, useAdminUserStatsQuery } from '@/api';

export const useAdminUserGameHistory = (userId: string, filters: GameHistoryFilters) => {
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
  } = useAdminUserGamesQuery(userId, filters);
  const {
    data: stats,
    isError: isStatsError,
    isFetching: isStatsFetching,
    isLoading: isStatsLoading,
    refetch: refetchStats,
  } = useAdminUserStatsQuery(userId, filters);

  const refreshAll = async () => {
    await Promise.all([refetch(), refetchStats()]);
  };

  return {
    fetchNextPage,
    games: data?.items ?? [],
    hasNextPage,
    isError,
    isFetching,
    isFetchingNextPage,
    isLoading,
    isStatsError,
    isStatsFetching,
    isStatsLoading,
    refreshAll,
    refreshing: (isRefetching || isStatsFetching) && !isLoading && !isFetchingNextPage,
    stats,
    totalCount: data?.totalCount ?? 0,
  };
};
