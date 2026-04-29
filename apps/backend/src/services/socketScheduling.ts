import { getGamePaceConfig, SCORE_ELIMINATION_THRESHOLD } from '@shedding-game/shared';

import type { Room } from '@/types';

import { scheduleGameJob } from './jobRunner';
import { migrateHost } from './room';

const ROUND_OVER_DISPLAY_MS = 2500;
const ROUND_OVER_SCHEDULE_TTL_GRACE_MS = 2000;
const TURN_TIMEOUT_SCHEDULE_TTL_GRACE_MS = 2000;

type GamePaceConfigLike = {
  kickDelayMs: number;
};

export const getRoundReadyData = (room: Room) => {
  const mustBeReady = room.players
    .filter((player) => !player.isLeaver && player.score < SCORE_ELIMINATION_THRESHOLD)
    .map((player) => player.id);
  const ready = room.readyForNextRoundPlayerIds ?? [];
  const allReady = mustBeReady.length > 0 && mustBeReady.every((id) => ready.includes(id));

  return { mustBeReady, ready, allReady };
};

const getTypedGamePaceConfig = (gamePace: Room['gamePace']): GamePaceConfigLike =>
  getGamePaceConfig(gamePace) as GamePaceConfigLike;

const getTurnTimeoutDelayMs = (turnStartedAt: number, gamePace: Room['gamePace']): number => {
  const { kickDelayMs } = getTypedGamePaceConfig(gamePace);
  return Math.max(0, turnStartedAt + kickDelayMs - Date.now());
};

export const finishGameIfHostCannotMigrate = (room: Room, playerId: string): boolean => {
  if (room.hostId !== playerId) {
    return false;
  }

  if (migrateHost(room)) {
    return false;
  }

  room.gameStatus = 'finished';
  room.gameFinishedAt = Date.now();
  room.turnStartedAt = undefined;
  return true;
};

export const scheduleDealCardsIfReady = (room: Room): void => {
  if (room.gameStatus !== 'round_over') {
    return;
  }

  if (!getRoundReadyData(room).allReady) {
    return;
  }

  void scheduleGameJob(
    'round_deal',
    { roomId: room.id },
    {
      delayMs: ROUND_OVER_DISPLAY_MS,
      dedupeKey: `round-deal:${room.id}`,
      dedupeTtlMs: ROUND_OVER_DISPLAY_MS + ROUND_OVER_SCHEDULE_TTL_GRACE_MS,
    }
  );
};

export const scheduleTurnTimeout = (room: Room): void => {
  if (room.gameStatus !== 'playing' || !room.turnStartedAt) {
    return;
  }

  const currentPlayer = room.players[room.currentPlayerIndex];
  if (currentPlayer.playerType !== 'human' || currentPlayer.isLeaver) {
    return;
  }

  const delayMs = getTurnTimeoutDelayMs(room.turnStartedAt, room.gamePace);

  void scheduleGameJob(
    'turn_timeout',
    {
      roomId: room.id,
      playerId: currentPlayer.id,
      turnStartedAt: room.turnStartedAt,
    },
    {
      delayMs,
      dedupeKey: `turn-timeout:${room.id}:${String(room.turnStartedAt)}`,
      dedupeTtlMs: delayMs + TURN_TIMEOUT_SCHEDULE_TTL_GRACE_MS,
    }
  );
};
