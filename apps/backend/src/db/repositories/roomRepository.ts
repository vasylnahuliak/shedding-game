import {
  type GameHistoryFilters,
  SCORE_ELIMINATION_THRESHOLD,
  type UserStats,
} from '@shedding-game/shared';

import { prisma } from '@/db/client';
import { mapRoomFromDb, mapRoomToDb } from '@/db/mappers/roomMapper';
import { bumpCacheNamespace } from '@/services/cache';
import type { Room } from '@/types';

import { mapRepositoryPlayer } from './repositoryUtils';
import {
  type AdminActiveRoomView,
  buildFinishedRoomScoreWhere,
  buildGameHistoryRoomWhere,
  buildStatsCountableRoomWhere,
  mapRoomIdentity,
  roomInclude,
  toNumber,
} from './roomRepository.helpers';

export const roomRepository = {
  async loadRoom(roomId: string): Promise<Room | null> {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: roomInclude,
    });

    if (!room) return null;
    return mapRoomFromDb(room);
  },

  async listAllRooms(): Promise<Room[]> {
    const rooms = await prisma.room.findMany({
      include: roomInclude,
    });

    return rooms.map(mapRoomFromDb);
  },

  async listRoomsByPlayer(userId: string): Promise<Room[]> {
    const rooms = await prisma.room.findMany({
      where: {
        players: {
          some: {
            playerId: userId,
          },
        },
      },
      include: roomInclude,
    });

    return rooms.map(mapRoomFromDb);
  },

  async findWaitingRoomByPlayer(userId: string): Promise<Room | null> {
    const room = await prisma.room.findFirst({
      where: {
        gameStatus: 'waiting',
        players: {
          some: {
            playerId: userId,
          },
        },
      },
      include: roomInclude,
    });

    if (!room) return null;
    return mapRoomFromDb(room);
  },

  async saveRoom(room: Room): Promise<void> {
    const mapped = mapRoomToDb(room);
    const { id, ...roomPayload } = mapped.room;

    await prisma.$transaction(async (tx) => {
      await tx.room.upsert({
        where: { id: room.id },
        create: {
          id,
          ...roomPayload,
        },
        update: roomPayload,
      });

      await tx.roomPlayer.deleteMany({ where: { roomId: room.id } });
      if (mapped.players.length > 0) {
        await tx.roomPlayer.createMany({ data: mapped.players });
      }

      await tx.roomCard.deleteMany({ where: { roomId: room.id } });
      if (mapped.cards.length > 0) {
        await tx.roomCard.createMany({ data: mapped.cards });
      }

      await tx.roomReadyPlayer.deleteMany({ where: { roomId: room.id } });
      if (mapped.readyPlayers.length > 0) {
        await tx.roomReadyPlayer.createMany({ data: mapped.readyPlayers });
      }

      await tx.roomRound.deleteMany({ where: { roomId: room.id } });
      for (const round of mapped.rounds) {
        await tx.roomRound.create({
          data: {
            roomId: room.id,
            roundIndex: round.roundIndex,
            entries: {
              create: round.entries.map((entry) => ({
                entryOrder: entry.entryOrder,
                playerId: entry.playerId,
                scoreChange: entry.scoreChange,
                totalScore: entry.totalScore,
                eventType: entry.eventType,
              })),
            },
          },
        });
      }
    });

    await bumpCacheNamespace('rooms');
  },

  async countActiveRoomsByHost(hostId: string): Promise<number> {
    return prisma.room.count({
      where: {
        hostId,
        gameStatus: {
          in: ['waiting', 'playing', 'round_over'],
        },
      },
    });
  },

  async deleteRoom(roomId: string): Promise<void> {
    await prisma.room.deleteMany({ where: { id: roomId } });
    await bumpCacheNamespace('rooms');
  },

  async listWaitingRooms(): Promise<
    Array<{ id: string; name: string; hostId: string; playerIds: string[] }>
  > {
    const rooms = await prisma.room.findMany({
      where: { gameStatus: 'waiting' },
      select: {
        id: true,
        name: true,
        hostId: true,
        players: {
          select: {
            playerId: true,
          },
        },
      },
    });

    return rooms.map((room) => ({
      ...mapRoomIdentity(room),
      playerIds: room.players.map((player) => player.playerId),
    }));
  },

  async getActiveGameForUser(
    userId: string
  ): Promise<{ id: string; name: string; gameStatus: string; playersCount: number } | null> {
    const room = await prisma.room.findFirst({
      where: {
        gameStatus: {
          in: ['playing', 'round_over'],
        },
        players: {
          some: {
            playerId: userId,
            isLeaver: false,
            score: {
              lt: SCORE_ELIMINATION_THRESHOLD,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        gameStatus: true,
        _count: {
          select: {
            players: true,
          },
        },
      },
    });

    if (!room) return null;

    return {
      id: room.id,
      name: room.name,
      gameStatus: room.gameStatus,
      playersCount: room._count.players,
    };
  },

  async listRoomsForAdmin(options?: {
    userId?: string;
    filters?: GameHistoryFilters;
  }): Promise<AdminActiveRoomView[]> {
    const rooms = await prisma.room.findMany({
      where: buildGameHistoryRoomWhere(options),
      orderBy: [{ createdAtMs: 'desc' }, { id: 'desc' }],
      include: {
        players: {
          orderBy: { turnOrder: 'asc' },
          select: {
            playerId: true,
            name: true,
            playerType: true,
            score: true,
            isLeaver: true,
          },
        },
        rounds: {
          orderBy: { roundIndex: 'desc' },
          take: 1,
          include: {
            entries: {
              orderBy: { entryOrder: 'asc' },
              select: {
                playerId: true,
                scoreChange: true,
                totalScore: true,
                eventType: true,
              },
            },
          },
        },
        _count: {
          select: {
            rounds: true,
          },
        },
      },
    });

    return rooms.map((room) => ({
      ...mapRoomIdentity(room),
      gameStatus: room.gameStatus,
      players: room.players.map(mapRepositoryPlayer),
      createdAt: Number(room.createdAtMs),
      gameStartedAt: toNumber(room.gameStartedAtMs),
      gameFinishedAt: toNumber(room.gameFinishedAtMs),
      roundsPlayed: room._count.rounds,
      lastRoundScores:
        room.rounds[0]?.entries.map((entry) => ({
          playerId: entry.playerId,
          scoreChange: entry.scoreChange,
          totalScore: entry.totalScore,
          event: entry.eventType ? { type: entry.eventType } : undefined,
        })) ?? undefined,
    }));
  },

  async getUserStats(userId: string, filters: GameHistoryFilters): Promise<UserStats> {
    const [gamesPlayed, wins, losses] = await prisma.$transaction([
      prisma.room.count({
        where: buildStatsCountableRoomWhere({ userId, filters }),
      }),
      prisma.room.count({
        where: buildFinishedRoomScoreWhere(userId, filters, 'lt'),
      }),
      prisma.room.count({
        where: buildFinishedRoomScoreWhere(userId, filters, 'gte'),
      }),
    ]);

    return { gamesPlayed, wins, losses };
  },
};
