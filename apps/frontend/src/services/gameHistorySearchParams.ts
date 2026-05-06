import {
  DEFAULT_GAME_HISTORY_FILTERS,
  type GameHistoryFilters,
  GameHistoryFiltersSchema,
  parseWithSchema,
} from '@shedding-game/shared';

type CursorPaginationSearchParamsOptions = {
  cursor?: string;
  limit?: number;
};

type GameHistorySearchParamsOptions = CursorPaginationSearchParamsOptions & {
  filters?: GameHistoryFilters;
};

export const addCursorPaginationSearchParams = (
  searchParams: Record<string, string>,
  options: CursorPaginationSearchParamsOptions
) => {
  if (typeof options.limit === 'number') {
    searchParams.limit = String(options.limit);
  }

  if (options.cursor) {
    searchParams.cursor = options.cursor;
  }

  return searchParams;
};

export const buildGameHistorySearchParams = (options: GameHistorySearchParamsOptions = {}) => {
  const filters = parseWithSchema(
    GameHistoryFiltersSchema,
    options.filters ?? DEFAULT_GAME_HISTORY_FILTERS
  );
  const searchParams: Record<string, string> = {
    playerTypeFilter: filters.playerTypeFilter,
    gameStatusFilter: filters.gameStatusFilter,
  };

  return addCursorPaginationSearchParams(searchParams, options);
};
