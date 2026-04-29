import type { GameHistoryFilters } from '@shedding-game/shared';

import type { AdminGame } from '@/types/rooms';

type GameHistoryListItemKeyFields = Pick<AdminGame, 'id' | 'isClosed' | 'closedAt' | 'createdAt'>;

export const getGameHistoryListKey = (filters: GameHistoryFilters) =>
  `${filters.playerTypeFilter}:${filters.gameStatusFilter}`;

export const getGameHistoryItemKey = (game: GameHistoryListItemKeyFields) =>
  game.isClosed ? `${game.id}-${game.closedAt ?? game.createdAt ?? 0}` : game.id;
