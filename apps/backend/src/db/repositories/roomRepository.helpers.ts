import type { Prisma } from '@prisma/client';
import type { GameHistoryFilters } from '@shedding-game/shared';

import {
  buildGameHistoryCountableWhere,
  buildGameHistoryFinishedScoreWhere,
  buildGameHistoryMembershipWhere,
  buildGameHistoryPlayerTypeWhere,
  buildGameHistoryStartedWhere,
  combineGameHistoryWhere,
} from '@/utils/gameHistory';

export const roomInclude = {
  players: {
    orderBy: { turnOrder: 'asc' },
  },
  cards: {
    orderBy: { position: 'asc' },
  },
  readyPlayers: true,
  rounds: {
    orderBy: { roundIndex: 'asc' },
    include: {
      entries: {
        orderBy: { entryOrder: 'asc' },
      },
    },
  },
} satisfies Prisma.RoomInclude;

export type AdminActiveRoomView = {
  id: string;
  name: string;
  hostId: string;
  gameStatus: 'waiting' | 'playing' | 'round_over' | 'finished';
  players: Array<{
    id: string;
    name: string;
    playerType: 'human' | 'bot';
    score: number;
    isLeaver?: boolean;
  }>;
  createdAt: number;
  gameStartedAt?: number;
  gameFinishedAt?: number;
  roundsPlayed: number;
  lastRoundScores?: Array<{
    playerId: string;
    scoreChange: number;
    totalScore: number;
    event?: { type: 'reset_115' | 'eliminated' | 'jack_bonus' | 'bridge' };
  }>;
};

export const toNumber = (value: bigint | null | undefined): number | undefined =>
  value == null ? undefined : Number(value);

export const mapRoomIdentity = (room: { id: string; name: string; hostId: string }) => ({
  id: room.id,
  name: room.name,
  hostId: room.hostId,
});

export const buildGameHistoryRoomWhere = (options?: {
  userId?: string;
  filters?: GameHistoryFilters;
}): Prisma.RoomWhereInput | undefined => {
  return combineGameHistoryWhere<Prisma.RoomWhereInput>(
    {
      gameStatus: {
        in: ['waiting', 'playing', 'round_over'],
      },
    },
    buildGameHistoryMembershipWhere(options?.userId),
    buildGameHistoryPlayerTypeWhere(options?.filters),
    buildGameHistoryStartedWhere(options?.filters, 'gameStartedAtMs')
  );
};

export const buildStatsCountableRoomWhere = (options: {
  userId: string;
  filters: GameHistoryFilters;
}): Prisma.RoomWhereInput | undefined => {
  return buildGameHistoryCountableWhere<Prisma.RoomWhereInput>(
    buildGameHistoryRoomWhere(options),
    'gameStartedAtMs'
  );
};

export const buildFinishedRoomScoreWhere = (
  userId: string,
  filters: GameHistoryFilters,
  comparator: 'lt' | 'gte'
): Prisma.RoomWhereInput | undefined => {
  return buildGameHistoryFinishedScoreWhere<Prisma.RoomWhereInput>(
    buildGameHistoryRoomWhere({ userId, filters }),
    userId,
    comparator
  );
};
