import type { GameHistoryFilters } from '@shedding-game/shared';

const getGameHistoryFilterKey = (filters: GameHistoryFilters) => {
  return [filters.playerTypeFilter, filters.gameStatusFilter] as const;
};

/**
 * Query key factories for consistent cache management
 * Following TanStack Query best practices:
 * - Hierarchical organization (entity → action → params)
 * - Factory pattern for type safety and autocomplete
 * - All keys are arrays for proper prefix matching
 */

export const roomKeys = {
  all: ['rooms'] as const,
  lists: () => [...roomKeys.all, 'list'] as const,
  details: () => [...roomKeys.all, 'detail'] as const,
  detail: (roomId: string) => [...roomKeys.details(), roomId] as const,
  active: () => [...roomKeys.all, 'active'] as const,
  games: () => [...roomKeys.all, 'games'] as const,
  gameList: (scope: 'all' | 'me', filters: GameHistoryFilters) =>
    [...roomKeys.games(), scope, ...getGameHistoryFilterKey(filters)] as const,
  admin: (filters: GameHistoryFilters) => roomKeys.gameList('all', filters),
  myGames: (filters: GameHistoryFilters) => roomKeys.gameList('me', filters),
};

export const statsKeys = {
  all: ['stats'] as const,
  me: (filters: GameHistoryFilters) =>
    [...statsKeys.all, 'me', ...getGameHistoryFilterKey(filters)] as const,
};

export const adminKeys = {
  all: ['admin'] as const,
  accountDeletionRequests: () => [...adminKeys.all, 'accountDeletionRequests'] as const,
  users: () => [...adminKeys.all, 'users'] as const,
  userList: (query: string) => [...adminKeys.users(), 'list', query] as const,
  userGames: (userId: string, filters: GameHistoryFilters) =>
    [...adminKeys.users(), userId, 'games', ...getGameHistoryFilterKey(filters)] as const,
  userStats: (userId: string, filters: GameHistoryFilters) =>
    [...adminKeys.users(), userId, 'stats', ...getGameHistoryFilterKey(filters)] as const,
};
