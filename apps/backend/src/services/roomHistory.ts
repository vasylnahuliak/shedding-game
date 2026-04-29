import type { AdminGame, GameHistoryFilters } from '@shedding-game/shared';

import { SCORE_ELIMINATION_THRESHOLD } from '@shedding-game/shared';

import type { AdminActiveRoomView } from '@/db/repositories/roomRepository.helpers';
import type { ClosedGame } from '@/types';

type GameHistoryCursorState = {
  activeOffset: number;
  closedCursor: {
    closedAt: number;
    archiveId: string;
  } | null;
};

const INITIAL_GAME_HISTORY_CURSOR: GameHistoryCursorState = {
  activeOffset: 0,
  closedCursor: null,
};

const isClosedCursor = (
  value: unknown
): value is NonNullable<GameHistoryCursorState['closedCursor']> => {
  return (
    typeof value === 'object' &&
    value != null &&
    'closedAt' in value &&
    typeof value.closedAt === 'number' &&
    Number.isFinite(value.closedAt) &&
    'archiveId' in value &&
    typeof value.archiveId === 'string' &&
    value.archiveId.length > 0
  );
};

export const decodeGameHistoryCursor = (cursor?: string): GameHistoryCursorState => {
  if (!cursor) {
    return INITIAL_GAME_HISTORY_CURSOR;
  }

  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as unknown;

    if (
      typeof parsed !== 'object' ||
      parsed == null ||
      !('activeOffset' in parsed) ||
      typeof parsed.activeOffset !== 'number' ||
      !Number.isInteger(parsed.activeOffset) ||
      parsed.activeOffset < 0
    ) {
      return INITIAL_GAME_HISTORY_CURSOR;
    }

    const closedCursor =
      'closedCursor' in parsed && isClosedCursor(parsed.closedCursor) ? parsed.closedCursor : null;

    return {
      activeOffset: parsed.activeOffset,
      closedCursor,
    };
  } catch {
    return INITIAL_GAME_HISTORY_CURSOR;
  }
};

export const encodeGameHistoryCursor = (cursor: GameHistoryCursorState): string => {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
};

export const buildGameHistoryCacheKey = (
  userId: string | undefined,
  options: {
    cursor?: string;
    filters: GameHistoryFilters;
    limit: number;
  }
) => {
  return [
    'games',
    userId ?? 'all',
    options.filters.playerTypeFilter,
    options.filters.gameStatusFilter,
    `limit:${String(options.limit)}`,
    `cursor:${options.cursor ?? 'start'}`,
  ].join(':');
};

export const mapActiveRoomToAdminGame = (room: AdminActiveRoomView): AdminGame => {
  const winner =
    room.gameStatus === 'round_over' || room.gameStatus === 'finished'
      ? room.players.find(
          (player) => player.score < SCORE_ELIMINATION_THRESHOLD && !player.isLeaver
        )
      : undefined;

  return {
    id: room.id,
    name: room.name,
    gameStatus: room.gameStatus,
    playersCount: room.players.length,
    players: room.players.map((player) => ({
      id: player.id,
      name: player.name,
      isHost: player.id === room.hostId,
      score: player.score,
      playerType: player.playerType,
      isLeaver: player.isLeaver,
    })),
    lastRoundScores: room.lastRoundScores,
    winnerId: winner?.id,
    isClosed: false,
    createdAt: room.createdAt,
    gameStartedAt: room.gameStartedAt,
    gameFinishedAt: room.gameFinishedAt,
    roundsPlayed: room.roundsPlayed,
    closedAt: undefined,
    closedReasonCode: undefined,
    closedReasonParams: undefined,
  };
};

export const mapClosedGameToAdminGame = (game: ClosedGame): AdminGame => {
  const winner =
    game.gameStatus === 'finished'
      ? game.players.find(
          (player) => player.score < SCORE_ELIMINATION_THRESHOLD && !player.isLeaver
        )
      : undefined;

  return {
    id: game.id,
    name: game.name,
    gameStatus: game.gameStatus,
    playersCount: game.players.length,
    players: game.players.map((player) => ({
      id: player.id,
      name: player.name,
      isHost: player.id === game.hostId,
      score: player.score,
      playerType: player.playerType,
      isLeaver: player.isLeaver,
    })),
    lastRoundScores: undefined,
    winnerId: winner?.id,
    isClosed: true,
    createdAt: game.createdAt,
    gameStartedAt: game.gameStartedAt,
    gameFinishedAt: game.gameFinishedAt,
    roundsPlayed: game.roundsPlayed ?? 0,
    closedAt: game.closedAt,
    closedReasonCode: game.closedReasonCode,
    closedReasonParams: game.closedReasonParams,
  };
};
