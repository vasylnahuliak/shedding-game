import { useGameStatistics } from '@/hooks/useGameStatistics';

import { useAdminFiltersStore } from './useAdminFilters';

export const useAdminGames = () => {
  const filters = useAdminFiltersStore((state) => state.filters);
  const {
    fetchNextPage,
    games,
    hasNextPage,
    isFetchingNextPage,
    isLoading: loading,
    refreshGames,
    refreshing,
    totalCount,
  } = useGameStatistics('all', filters);

  return {
    fetchNextPage,
    games,
    hasNextPage,
    isFetchingNextPage,
    loading,
    refreshGames,
    refreshing,
    totalCount,
  };
};
