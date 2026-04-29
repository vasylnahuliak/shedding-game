import type {
  ActiveGame,
  BackendMessageCode,
  GameHistoryFilters,
  GameHistoryPage,
  RoomDetails,
  RoomSummary,
  UserStats,
} from '@shedding-game/shared';

import {
  ActiveGameNullableSchema,
  GameHistoryPageSchema,
  MAX_PLAYERS,
  parseWithSchema,
  RoomDetailsSchema,
  RoomSummaryListSchema,
  SCORE_ELIMINATION_THRESHOLD,
  UserStatsSchema,
} from '@shedding-game/shared';

import { closedGameRepository } from '@/db/repositories/closedGameRepository';
import { roomRepository } from '@/db/repositories/roomRepository';
import type { Room } from '@/types';

import { getCacheTtlMs, getOrSetNamespacedCache } from './cache';
import {
  buildGameHistoryCacheKey,
  decodeGameHistoryCursor,
  encodeGameHistoryCursor,
  mapActiveRoomToAdminGame,
  mapClosedGameToAdminGame,
} from './roomHistory';

const ROOMS_WAITING_CACHE_TTL_MS = getCacheTtlMs('REDIS_ROOMS_CACHE_TTL_MS', 5000);
const ROOMS_ALL_GAMES_CACHE_TTL_MS = getCacheTtlMs('REDIS_ALL_GAMES_CACHE_TTL_MS', 5000);
const ROOMS_ACTIVE_GAME_CACHE_TTL_MS = getCacheTtlMs('REDIS_ACTIVE_GAME_CACHE_TTL_MS', 3000);

export const getRoomsList = async (userId?: string): Promise<RoomSummary[]> => {
  const key = `waiting-list:user:${userId ?? 'anon'}`;
  return getOrSetNamespacedCache('rooms', key, ROOMS_WAITING_CACHE_TTL_MS, async () => {
    const rooms = await roomRepository.listWaitingRooms();

    return parseWithSchema(
      RoomSummaryListSchema,
      rooms.map(({ id, name, hostId, playerIds }) => ({
        id,
        name,
        playersCount: playerIds.length,
        maxPlayers: MAX_PLAYERS,
        isCurrentUserInRoom: userId ? playerIds.includes(userId) : false,
        isCurrentUserHost: userId ? hostId === userId : false,
      }))
    );
  });
};

/** Returns the shared paged game history, optionally scoped to one user. */
export const getGamesPage = async (
  userId: string | undefined,
  options: {
    cursor?: string;
    filters: GameHistoryFilters;
    limit: number;
  }
): Promise<GameHistoryPage> => {
  const key = buildGameHistoryCacheKey(userId, options);

  return getOrSetNamespacedCache('rooms', key, ROOMS_ALL_GAMES_CACHE_TTL_MS, async () => {
    const cursor = decodeGameHistoryCursor(options.cursor);
    const [activeRooms, closedGamesCount] = await Promise.all([
      roomRepository.listRoomsForAdmin({ userId, filters: options.filters }),
      closedGameRepository.countAll({ userId, filters: options.filters }),
    ]);

    const activeCount = activeRooms.length;
    const activeOffset = Math.min(cursor.activeOffset, activeCount);
    const activeItems = activeRooms
      .slice(activeOffset, activeOffset + options.limit)
      .map(mapActiveRoomToAdminGame);
    const totalCount = activeCount + closedGamesCount;

    if (activeItems.length === options.limit) {
      const nextActiveOffset = activeOffset + activeItems.length;
      const hasMore = nextActiveOffset < activeCount || closedGamesCount > 0;

      return parseWithSchema(GameHistoryPageSchema, {
        items: activeItems,
        totalCount,
        hasMore,
        nextCursor: hasMore
          ? encodeGameHistoryCursor({ activeOffset: nextActiveOffset, closedCursor: null })
          : undefined,
      });
    }

    const closedGamesPage = await closedGameRepository.listPage({
      userId,
      filters: options.filters,
      limit: options.limit - activeItems.length,
      cursor: activeOffset >= activeCount ? (cursor.closedCursor ?? undefined) : undefined,
    });

    return parseWithSchema(GameHistoryPageSchema, {
      items: [...activeItems, ...closedGamesPage.games.map(mapClosedGameToAdminGame)],
      totalCount,
      hasMore: closedGamesPage.hasMore,
      nextCursor: closedGamesPage.hasMore
        ? encodeGameHistoryCursor({
            activeOffset: activeCount,
            closedCursor: closedGamesPage.nextCursor ?? null,
          })
        : undefined,
    });
  });
};

export const getUserStatsSummary = async (
  userId: string,
  filters: GameHistoryFilters
): Promise<UserStats> => {
  const key = ['stats', userId, filters.playerTypeFilter, filters.gameStatusFilter].join(':');

  return getOrSetNamespacedCache('rooms', key, ROOMS_ALL_GAMES_CACHE_TTL_MS, async () => {
    const [activeStats, closedStats] = await Promise.all([
      roomRepository.getUserStats(userId, filters),
      closedGameRepository.getUserStats(userId, filters),
    ]);

    return parseWithSchema(UserStatsSchema, {
      wins: activeStats.wins + closedStats.wins,
      losses: activeStats.losses + closedStats.losses,
      gamesPlayed: activeStats.gamesPlayed + closedStats.gamesPlayed,
    });
  });
};

export const archiveClosedGame = async (
  room: Room,
  reasonCode?: BackendMessageCode,
  reasonParams?: Record<string, string | number>
) => {
  await closedGameRepository.archiveRoom(room, reasonCode, reasonParams);
};

export const getActiveGame = async (userId: string): Promise<ActiveGame | null> => {
  const key = `active-game:user:${userId}`;
  return getOrSetNamespacedCache('rooms', key, ROOMS_ACTIVE_GAME_CACHE_TTL_MS, async () => {
    return parseWithSchema(
      ActiveGameNullableSchema,
      await roomRepository.getActiveGameForUser(userId)
    );
  });
};

/**
 * Migrate host to the next eligible player when current host leaves.
 * Returns true if migration succeeded, false if no eligible players.
 * Eligible: human, not isLeaver, not eliminated.
 */
export const migrateHost = (room: Room): boolean => {
  const currentHostIndex = room.players.findIndex((p) => p.id === room.hostId);

  const eligiblePlayers = room.players.filter(
    (p) =>
      p.id !== room.hostId &&
      p.playerType === 'human' &&
      !p.isLeaver &&
      p.score < SCORE_ELIMINATION_THRESHOLD
  );

  if (eligiblePlayers.length === 0) {
    return false;
  }

  const playersAfterHost = room.players
    .slice(currentHostIndex + 1)
    .filter((p) => eligiblePlayers.some((ep) => ep.id === p.id));
  const playersBeforeHost = room.players
    .slice(0, currentHostIndex)
    .filter((p) => eligiblePlayers.some((ep) => ep.id === p.id));

  const newHost = playersAfterHost[0] ?? playersBeforeHost[0];
  room.hostId = newHost.id;

  return true;
};

export const finishRoomIfNoActiveHumans = (room: Room): boolean => {
  const activePlayers = room.players.filter(
    (player) => player.score < SCORE_ELIMINATION_THRESHOLD && !player.isLeaver
  );
  const activeHumans = activePlayers.filter((player) => player.playerType === 'human');

  if (activePlayers.length > 1 && activeHumans.length > 0) {
    return false;
  }

  room.gameStatus = 'finished';
  room.gameFinishedAt = Date.now();
  room.turnStartedAt = undefined;

  const winner =
    activePlayers.length === 1 && activePlayers[0]?.playerType === 'human'
      ? activePlayers[0]
      : undefined;

  room.winnerId = winner?.id;
  room.winnerName = winner?.name;

  return true;
};

export const canAccessRoom = (room: Room, userId: string): boolean => {
  if (room.gameStatus === 'waiting') {
    return true;
  }

  return room.players.some((player) => player.id === userId && !player.isLeaver);
};

export const getSanitizedRoom = (
  room: Room,
  userId: string,
  onlineUserIds?: Set<string>
): RoomDetails => {
  const revealAllHands = room.gameStatus === 'round_over' || room.gameStatus === 'finished';

  return parseWithSchema(RoomDetailsSchema, {
    ...room,
    deck: room.deck ? room.deck.length : 0,
    players: room.players.map((p) => ({
      ...p,
      hand: p.id === userId || revealAllHands ? p.hand : p.hand ? p.hand.length : 0,
      isOnline: onlineUserIds && p.playerType === 'human' ? onlineUserIds.has(p.id) : undefined,
    })),
  });
};
