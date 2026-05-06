import {
  DEFAULT_GAME_HISTORY_FILTERS,
  type GameHistoryFilters,
  GameHistoryFiltersInputSchema,
  safeParseWithSchema,
  SCORE_ELIMINATION_THRESHOLD,
} from '@shedding-game/shared';

type GameHistoryWhereClause = Record<string, unknown>;

const DEFAULT_GAME_HISTORY_PAGE_LIMIT = 20;
const MAX_GAME_HISTORY_PAGE_LIMIT = 50;

type GameHistoryQueryInput = {
  cursor?: unknown;
  gameStatusFilter?: unknown;
  limit?: unknown;
  playerTypeFilter?: unknown;
};

export const combineGameHistoryWhere = <T extends GameHistoryWhereClause>(
  ...clauses: Array<T | undefined>
): T | undefined => {
  const filteredClauses = clauses.filter((clause): clause is T => clause != null);

  if (filteredClauses.length === 0) {
    return undefined;
  }

  if (filteredClauses.length === 1) {
    return filteredClauses[0];
  }

  return { AND: filteredClauses } as unknown as T;
};

export const buildGameHistoryMembershipWhere = (
  userId?: string
): GameHistoryWhereClause | undefined => {
  if (!userId) {
    return undefined;
  }

  return {
    players: {
      some: {
        playerId: userId,
      },
    },
  };
};

export const buildGameHistoryPlayerTypeWhere = (
  filters?: GameHistoryFilters
): GameHistoryWhereClause | undefined => {
  switch (filters?.playerTypeFilter) {
    case 'all':
    case undefined:
      return undefined;
    case 'humans-only':
      return {
        players: {
          none: {
            playerType: 'bot',
            isLeaver: false,
          },
        },
      };
    case 'bots-only':
      return {
        players: {
          some: {
            playerType: 'bot',
            isLeaver: false,
          },
        },
      };
  }
};

export const buildGameHistoryStartedWhere = (
  filters: GameHistoryFilters | undefined,
  startedAtField: string
): GameHistoryWhereClause | undefined => {
  switch (filters?.gameStatusFilter) {
    case 'all':
    case undefined:
      return undefined;
    case 'started-only':
      return {
        [startedAtField]: {
          not: null,
        },
      };
    case 'unstarted-only':
      return {
        [startedAtField]: null,
      };
  }
};

export const buildGameHistoryCountableWhere = <T extends GameHistoryWhereClause>(
  baseWhere: T | undefined,
  startedAtField: string
): T | undefined => {
  return combineGameHistoryWhere<T>(baseWhere, {
    OR: [
      {
        gameStatus: {
          not: 'waiting',
        },
      },
      {
        [startedAtField]: {
          not: null,
        },
      },
    ],
  } as unknown as T);
};

export const buildGameHistoryFinishedScoreWhere = <T extends GameHistoryWhereClause>(
  baseWhere: T | undefined,
  userId: string,
  comparator: 'lt' | 'gte'
): T | undefined => {
  return combineGameHistoryWhere<T>(
    baseWhere,
    {
      gameStatus: 'finished',
    } as unknown as T,
    {
      players: {
        some: {
          playerId: userId,
          score:
            comparator === 'lt'
              ? {
                  lt: SCORE_ELIMINATION_THRESHOLD,
                }
              : {
                  gte: SCORE_ELIMINATION_THRESHOLD,
                },
        },
      },
    } as unknown as T
  );
};

export const resolveGameHistoryFilters = (input: {
  gameStatusFilter?: unknown;
  playerTypeFilter?: unknown;
}): GameHistoryFilters => {
  const result = safeParseWithSchema(GameHistoryFiltersInputSchema, input);

  return result.success
    ? {
        ...DEFAULT_GAME_HISTORY_FILTERS,
        ...result.output,
      }
    : { ...DEFAULT_GAME_HISTORY_FILTERS };
};

export const resolveBoundedPageLimit = (
  rawLimit: unknown,
  defaultLimit: number,
  maxLimit: number
): number => {
  const parsedLimit = Number(rawLimit);

  return Number.isFinite(parsedLimit)
    ? Math.max(1, Math.min(maxLimit, Math.floor(parsedLimit)))
    : defaultLimit;
};

const resolveGameHistoryLimit = (rawLimit: unknown): number =>
  resolveBoundedPageLimit(rawLimit, DEFAULT_GAME_HISTORY_PAGE_LIMIT, MAX_GAME_HISTORY_PAGE_LIMIT);

export const resolveGameHistoryCursor = (rawCursor: unknown): string | undefined => {
  if (typeof rawCursor !== 'string') {
    return undefined;
  }

  const cursor = rawCursor.trim();
  return cursor.length > 0 ? cursor : undefined;
};

export const resolveGameHistoryPageOptions = (query: GameHistoryQueryInput) => ({
  limit: resolveGameHistoryLimit(query.limit),
  cursor: resolveGameHistoryCursor(query.cursor),
  filters: resolveGameHistoryFilters({
    playerTypeFilter: query.playerTypeFilter,
    gameStatusFilter: query.gameStatusFilter,
  }),
});
