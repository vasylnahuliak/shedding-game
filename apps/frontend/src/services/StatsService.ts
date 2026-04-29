import type { GameHistoryFilters, UserStats } from '@shedding-game/shared';

import { UserStatsSchema } from '@shedding-game/shared';

import { parseApiResponse } from './contractValidation';
import { buildGameHistorySearchParams } from './gameHistorySearchParams';
import { api } from './index';

const getMyStats = async (filters: GameHistoryFilters): Promise<UserStats> => {
  const response = await api.get('stats/me', {
    searchParams: buildGameHistorySearchParams({ filters }),
  });

  return parseApiResponse(response, UserStatsSchema, 'GET stats/me');
};

export const StatsService = {
  getMyStats,
};
