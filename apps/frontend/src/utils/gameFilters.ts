import {
  DEFAULT_GAME_HISTORY_FILTERS,
  type GameHistoryFilters,
  type GameStatusFilter,
  type PlayerTypeFilter,
} from '@shedding-game/shared';

export type GameFilters = GameHistoryFilters;
export type { GameStatusFilter, PlayerTypeFilter };

export const createDefaultGameFilters = (): GameFilters => ({
  ...DEFAULT_GAME_HISTORY_FILTERS,
});

export const getActiveGameFiltersCount = (filters: GameFilters) => {
  let count = 0;

  if (filters.playerTypeFilter !== 'all') {
    count++;
  }

  if (filters.gameStatusFilter !== 'all') {
    count++;
  }

  return count;
};
