import type { AppLocale } from '@shedding-game/shared';

import { SCORE_ELIMINATION_THRESHOLD } from '@shedding-game/shared';

import { roomRepository } from '@/db/repositories/roomRepository';
import { DELETED_ACCOUNT_NAME, userRepository } from '@/db/repositories/userRepository';
import { scheduleBotTurn } from '@/services/bot';
import { declineBridge } from '@/services/game';
import { archiveClosedGame, finishRoomIfNoActiveHumans, migrateHost } from '@/services/room';
import { withRoomLock, withUserLock } from '@/services/roomMutex';
import { saveRoomWithAutoArchive } from '@/services/roomPersistence';
import {
  broadcastRoomClosed,
  broadcastRooms,
  broadcastRoomUpdate,
  disconnectUserSockets,
} from '@/services/socket';
import { deleteSupabaseAuthUser, SupabaseAdminError } from '@/services/supabaseAdmin';
import type { Room } from '@/types';

class AccountDeletionError extends Error {
  cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'AccountDeletionError';
    this.cause = cause;
  }
}

const reassignHostAfterDeletion = (room: Room, deletedUserId: string): boolean => {
  if (room.hostId !== deletedUserId) {
    return true;
  }

  if (migrateHost(room)) {
    return true;
  }

  const fallbackHost = room.players.find(
    (player) => player.id !== deletedUserId && player.playerType === 'human'
  );

  if (!fallbackHost) {
    return false;
  }

  room.hostId = fallbackHost.id;
  return true;
};

const closeRoomBecauseHostLeft = async (room: Room, locale: AppLocale) => {
  broadcastRoomClosed(room.id, 'ROOM_CLOSED_HOST_LEFT', undefined, locale);

  if (room.gameStatus !== 'finished') {
    await archiveClosedGame(room, 'ROOM_CLOSED_HOST_LEFT');
  }

  await roomRepository.deleteRoom(room.id);
};

const deleteAccountRooms = async (
  userId: string,
  locale: AppLocale
): Promise<{ updatedRooms: Room[]; shouldBroadcastRooms: boolean }> => {
  const updatedRooms: Room[] = [];
  const botTurnRoomIds = new Set<string>();
  let shouldBroadcastRooms = false;

  const affectedRooms = await roomRepository.listRoomsByPlayer(userId);

  for (const { id: roomId } of affectedRooms) {
    await withRoomLock(roomId, async () => {
      const room = await roomRepository.loadRoom(roomId);
      if (!room) {
        return;
      }

      const playerIndex = room.players.findIndex((player) => player.id === userId);
      if (playerIndex === -1) {
        return;
      }

      const player = room.players[playerIndex];
      const isHost = room.hostId === userId;

      if (room.gameStatus === 'waiting') {
        if (isHost) {
          await closeRoomBecauseHostLeft(room, locale);
        } else {
          room.players.splice(playerIndex, 1);
          await roomRepository.saveRoom(room);
          updatedRooms.push(room);
        }

        shouldBroadcastRooms = true;
        return;
      }

      const previousStatus = room.gameStatus;

      if (room.bridgeAvailable && room.bridgePlayerId === userId) {
        declineBridge(room, userId);
      }

      player.isLeaver = true;
      player.name = DELETED_ACCOUNT_NAME;

      if (room.winnerId === userId) {
        room.winnerName = DELETED_ACCOUNT_NAME;
      }

      if (room.gameStatus === 'round_over') {
        room.readyForNextRoundPlayerIds = Array.from(
          new Set([...(room.readyForNextRoundPlayerIds ?? []), userId])
        );
      }

      if (isHost && !reassignHostAfterDeletion(room, userId)) {
        await closeRoomBecauseHostLeft(room, locale);
        shouldBroadcastRooms = true;
        return;
      }

      if (room.gameStatus !== 'finished') {
        finishRoomIfNoActiveHumans(room);
      }
      await saveRoomWithAutoArchive(room, previousStatus);
      updatedRooms.push(room);
      shouldBroadcastRooms = true;

      if (
        room.gameStatus === 'playing' &&
        room.currentPlayerIndex === playerIndex &&
        player.score < SCORE_ELIMINATION_THRESHOLD
      ) {
        botTurnRoomIds.add(room.id);
      }
    });
  }

  for (const room of updatedRooms) {
    await broadcastRoomUpdate(room);
  }

  if (shouldBroadcastRooms) {
    await broadcastRooms();
  }

  for (const roomId of botTurnRoomIds) {
    scheduleBotTurn(roomId);
  }

  return { updatedRooms, shouldBroadcastRooms };
};

export const deleteAccount = async (userId: string, locale: AppLocale): Promise<void> => {
  try {
    await withUserLock(userId, async () => {
      await disconnectUserSockets(userId);
      await deleteAccountRooms(userId, locale);
      await userRepository.anonymizeDeletedAccountReferences(userId);
      await userRepository.deleteById(userId);
      await deleteSupabaseAuthUser(userId);
    });
  } catch (error) {
    if (error instanceof AccountDeletionError) {
      throw error;
    }

    if (error instanceof SupabaseAdminError) {
      throw new AccountDeletionError(error.message, error);
    }

    throw new AccountDeletionError('Failed to delete account', error);
  }
};
