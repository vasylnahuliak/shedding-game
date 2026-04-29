import type { GameHistoryFilters } from '@shedding-game/shared';
import { queryOptions, useQuery } from '@tanstack/react-query';

import { StatsService } from '@/services/StatsService';

import { statsKeys } from '../query-keys';

const statsQueries = {
  me: (filters: GameHistoryFilters, enabled: boolean) =>
    queryOptions({
      queryKey: statsKeys.me(filters),
      queryFn: () => StatsService.getMyStats(filters),
      enabled,
      staleTime: 5 * 60 * 1000, // 5 minutes — stats don't change frequently
    }),
};

export const useMyStatsQuery = (filters: GameHistoryFilters, options?: { enabled?: boolean }) => {
  return useQuery(statsQueries.me(filters, options?.enabled ?? true));
};
