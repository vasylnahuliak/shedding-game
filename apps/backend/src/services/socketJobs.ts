import {
  DEFAULT_LOCALE,
  ROOM_GAME_EXPIRY_MS,
  ROOM_WAITING_EXPIRY_MS,
  SCORE_ELIMINATION_THRESHOLD,
} from '@shedding-game/shared';

import { roomRepository } from '@/db/repositories/roomRepository';
import type { Room } from '@/types';

import { executeBotTurn, scheduleBotTurn, scheduleBotTurnAfterDeal } from './bot';
import { dealCards, resolveDeadlockIfNeeded } from './game';
import type { GameJobHandlers } from './jobRunner';
import { scheduleGameJob } from './jobRunner';
import { archiveClosedGame, finishRoomIfNoActiveHumans } from './room';
import { withRoomLock } from './roomMutex';
import { saveRoomWithAutoArchive } from './roomPersistence';
import {
  broadcastPlayerKicked,
  broadcastRoomClosed,
  broadcastRoomNotice,
  broadcastRooms,
  broadcastRoomUpdate,
} from './socketBroadcasts';
import { finishGameIfHostCannotMigrate, getRoundReadyData } from './socketScheduling';

const STALE_CLEANUP_INTERVAL_MS = 60_000;

const runRoundDealIfReady = async (roomId: string): Promise<void> => {
  await withRoomLock(roomId, async () => {
    const room = await roomRepository.loadRoom(roomId);
    if (!room || room.gameStatus !== 'round_over') {
      return;
    }

    if (!getRoundReadyData(room).allReady) {
      return;
    }

    const previousStatus = room.gameStatus;
    dealCards(room, room.currentPlayerIndex);
    const deadlockResolved = resolveDeadlockIfNeeded(room);
    await saveRoomWithAutoArchive(room, previousStatus);
    await broadcastRoomUpdate(room);

    if (deadlockResolved) {
      await broadcastRoomNotice(room.id, 'GAME_DEADLOCK_RESOLVED');
    }

    scheduleBotTurnAfterDeal(room);
  });
};

const runTurnTimeoutIfNeeded = async (payload: {
  roomId: string;
  playerId: string;
  turnStartedAt: number;
}): Promise<void> => {
  const result = await withRoomLock(
    payload.roomId,
    async (): Promise<{ updatedRoom: Room | null; shouldScheduleBot: boolean }> => {
      const room = await roomRepository.loadRoom(payload.roomId);
      if (!room || room.gameStatus !== 'playing' || room.turnStartedAt !== payload.turnStartedAt) {
        return { updatedRoom: null, shouldScheduleBot: false };
      }

      const currentPlayer = room.players[room.currentPlayerIndex];
      if (
        currentPlayer.id !== payload.playerId ||
        currentPlayer.playerType !== 'human' ||
        currentPlayer.isLeaver ||
        currentPlayer.score >= SCORE_ELIMINATION_THRESHOLD
      ) {
        return { updatedRoom: null, shouldScheduleBot: false };
      }

      const previousStatus = room.gameStatus;
      currentPlayer.isLeaver = true;

      if (finishGameIfHostCannotMigrate(room, payload.playerId)) {
        await saveRoomWithAutoArchive(room, previousStatus);
        return { updatedRoom: room, shouldScheduleBot: false };
      }

      const shouldScheduleBot = !finishRoomIfNoActiveHumans(room);
      await saveRoomWithAutoArchive(room, previousStatus);
      return { updatedRoom: room, shouldScheduleBot };
    }
  );

  if (result.updatedRoom === null) {
    return;
  }

  await broadcastPlayerKicked(payload.roomId, payload.playerId, 'timeout');
  await broadcastRoomUpdate(result.updatedRoom);
  if (result.shouldScheduleBot) {
    scheduleBotTurn(result.updatedRoom);
  }
};

let staleCleanupInProgress = false;

const runStaleRoomCleanupOnce = async (): Promise<void> => {
  if (staleCleanupInProgress) {
    return;
  }

  staleCleanupInProgress = true;

  try {
    const changedRoomIds: string[] = [];
    const rooms = await roomRepository.listAllRooms();
    const now = Date.now();

    for (const staleCandidate of rooms) {
      await withRoomLock(staleCandidate.id, async () => {
        const room = await roomRepository.loadRoom(staleCandidate.id);
        if (!room) {
          return;
        }

        const staleWaiting =
          room.gameStatus === 'waiting' && now - room.createdAt >= ROOM_WAITING_EXPIRY_MS;
        const staleIdle =
          room.gameStatus !== 'waiting' && now - room.lastActivityAt >= ROOM_GAME_EXPIRY_MS;

        if (!staleWaiting && !staleIdle) {
          return;
        }

        const expiryMinutes = staleWaiting
          ? Math.floor(ROOM_WAITING_EXPIRY_MS / 60000)
          : Math.floor(ROOM_GAME_EXPIRY_MS / 60000);

        const reasonCode =
          room.gameStatus === 'finished' ? 'ROOM_CLOSED_FINISHED' : 'ROOM_CLOSED_IDLE_TIMEOUT';
        const reasonParams =
          room.gameStatus === 'finished' ? undefined : { minutes: expiryMinutes };

        broadcastRoomClosed(room.id, reasonCode, reasonParams, DEFAULT_LOCALE);
        await archiveClosedGame(room, reasonCode, reasonParams);
        await roomRepository.deleteRoom(room.id);
        changedRoomIds.push(room.id);
      });
    }

    if (changedRoomIds.length > 0) {
      await broadcastRooms();
    }
  } finally {
    staleCleanupInProgress = false;
  }
};

export const scheduleStaleCleanupTick = async (): Promise<void> => {
  await scheduleGameJob(
    'stale_cleanup',
    {},
    {
      delayMs: STALE_CLEANUP_INTERVAL_MS,
      dedupeKey: 'stale-cleanup-tick',
      dedupeTtlMs: STALE_CLEANUP_INTERVAL_MS + 5000,
    }
  );
};

const runStaleCleanupJob = async (): Promise<void> => {
  try {
    await runStaleRoomCleanupOnce();
  } finally {
    await scheduleStaleCleanupTick();
  }
};

export const createSocketJobHandlers = (): GameJobHandlers => ({
  bot_turn: async ({ roomId }) => {
    await executeBotTurn(roomId);
  },
  round_deal: async ({ roomId }) => {
    await runRoundDealIfReady(roomId);
  },
  stale_cleanup: async () => {
    await runStaleCleanupJob();
  },
  turn_timeout: async (payload) => {
    await runTurnTimeoutIfNeeded(payload);
  },
});
