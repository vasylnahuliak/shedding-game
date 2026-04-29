import type { Prisma } from '@prisma/client';

import {
  type BackendMessageCode,
  type GameHistoryFilters,
  type UserStats,
} from '@shedding-game/shared';

import { prisma } from '@/db/client';
import { mapClosedGameFromDb, mapClosedGameToDb } from '@/db/mappers/roomMapper';
import { bumpCacheNamespace } from '@/services/cache';
import type { ClosedGame, Room } from '@/types';
import {
  buildGameHistoryCountableWhere,
  buildGameHistoryFinishedScoreWhere,
  buildGameHistoryMembershipWhere,
  buildGameHistoryPlayerTypeWhere,
  buildGameHistoryStartedWhere,
  combineGameHistoryWhere,
} from '@/utils/gameHistory';

import { mapRepositoryPlayer } from './repositoryUtils';

type ClosedGamePageCursor = {
  closedAt: number;
  archiveId: string;
};

const mapRoomToClosedGame = (room: Room): Omit<ClosedGame, 'id'> => ({
  roomId: room.id,
  name: room.name,
  hostId: room.hostId,
  gameStatus: room.gameStatus,
  players: room.players.map(mapRepositoryPlayer),
  roundsPlayed: room.scoreHistory?.length ?? 0,
  createdAt: room.createdAt,
  gameStartedAt: room.gameStartedAt,
  gameFinishedAt: room.gameFinishedAt,
  closedAt: Date.now(),
});

const buildGameHistoryClosedGameWhere = (options?: {
  userId?: string;
  filters?: GameHistoryFilters;
}): Prisma.ClosedGameWhereInput | undefined => {
  return combineGameHistoryWhere<Prisma.ClosedGameWhereInput>(
    buildGameHistoryMembershipWhere(options?.userId) as Prisma.ClosedGameWhereInput | undefined,
    buildGameHistoryPlayerTypeWhere(options?.filters) as Prisma.ClosedGameWhereInput | undefined,
    buildGameHistoryStartedWhere(options?.filters, 'gameStartedAtMs') as
      | Prisma.ClosedGameWhereInput
      | undefined
  );
};

const buildCountableClosedGameWhere = (options: {
  userId: string;
  filters: GameHistoryFilters;
}): Prisma.ClosedGameWhereInput | undefined => {
  return buildGameHistoryCountableWhere<Prisma.ClosedGameWhereInput>(
    buildGameHistoryClosedGameWhere(options),
    'gameStartedAtMs'
  );
};

const buildFinishedClosedGameScoreWhere = (
  userId: string,
  filters: GameHistoryFilters,
  comparator: 'lt' | 'gte'
): Prisma.ClosedGameWhereInput | undefined => {
  return buildGameHistoryFinishedScoreWhere<Prisma.ClosedGameWhereInput>(
    buildGameHistoryClosedGameWhere({ userId, filters }),
    userId,
    comparator
  );
};

const buildClosedGameCursorWhere = (
  cursor?: ClosedGamePageCursor
): Prisma.ClosedGameWhereInput | undefined => {
  if (!cursor) {
    return undefined;
  }

  const closedAtMs = BigInt(cursor.closedAt);

  return {
    OR: [
      {
        closedAtMs: {
          lt: closedAtMs,
        },
      },
      {
        closedAtMs,
        archiveId: {
          lt: cursor.archiveId,
        },
      },
    ],
  };
};

export const closedGameRepository = {
  async archiveRoom(
    room: Room,
    reasonCode?: BackendMessageCode,
    reasonParams?: Record<string, string | number>
  ): Promise<void> {
    const data = mapClosedGameToDb(mapRoomToClosedGame(room), reasonCode, reasonParams);

    await prisma.closedGame.create({
      data: {
        roomId: data.roomId,
        name: data.name,
        hostId: data.hostId,
        gameStatus: data.gameStatus,
        roundsPlayed: data.roundsPlayed,
        createdAtMs: data.createdAtMs,
        gameStartedAtMs: data.gameStartedAtMs,
        gameFinishedAtMs: data.gameFinishedAtMs,
        closedAtMs: data.closedAtMs,
        closedReasonCode: data.closedReasonCode,
        closedReasonParams: data.closedReasonParams,
        players: {
          create: data.players,
        },
      },
    });

    await Promise.all([bumpCacheNamespace('rooms'), bumpCacheNamespace('stats')]);
  },

  async listAll(options?: {
    userId?: string;
    filters?: GameHistoryFilters;
  }): Promise<ClosedGame[]> {
    const records = await prisma.closedGame.findMany({
      where: buildGameHistoryClosedGameWhere(options),
      orderBy: [{ closedAtMs: 'desc' }, { archiveId: 'desc' }],
      include: {
        players: {
          orderBy: { playerOrder: 'asc' },
        },
      },
    });

    return records.map(mapClosedGameFromDb);
  },

  async countAll(options?: { userId?: string; filters?: GameHistoryFilters }): Promise<number> {
    return prisma.closedGame.count({
      where: buildGameHistoryClosedGameWhere(options),
    });
  },

  async listPage(options: {
    userId?: string;
    filters?: GameHistoryFilters;
    limit: number;
    cursor?: ClosedGamePageCursor;
  }): Promise<{
    games: ClosedGame[];
    hasMore: boolean;
    nextCursor?: ClosedGamePageCursor;
  }> {
    const records = await prisma.closedGame.findMany({
      where: combineGameHistoryWhere(
        buildGameHistoryClosedGameWhere(options),
        buildClosedGameCursorWhere(options.cursor)
      ),
      orderBy: [{ closedAtMs: 'desc' }, { archiveId: 'desc' }],
      take: options.limit + 1,
      include: {
        players: {
          orderBy: { playerOrder: 'asc' },
        },
      },
    });

    const pageRecords = records.slice(0, options.limit);
    const games = pageRecords.map(mapClosedGameFromDb);
    const hasMore = records.length > options.limit;
    const lastGame = games[games.length - 1];

    return {
      games,
      hasMore,
      nextCursor:
        hasMore && lastGame
          ? {
              closedAt: lastGame.closedAt,
              archiveId: lastGame.id,
            }
          : undefined,
    };
  },

  async getUserStats(userId: string, filters: GameHistoryFilters): Promise<UserStats> {
    const [gamesPlayed, wins, losses] = await prisma.$transaction([
      prisma.closedGame.count({
        where: buildCountableClosedGameWhere({ userId, filters }),
      }),
      prisma.closedGame.count({
        where: buildFinishedClosedGameScoreWhere(userId, filters, 'lt'),
      }),
      prisma.closedGame.count({
        where: buildFinishedClosedGameScoreWhere(userId, filters, 'gte'),
      }),
    ]);

    return { gamesPlayed, wins, losses };
  },
};
