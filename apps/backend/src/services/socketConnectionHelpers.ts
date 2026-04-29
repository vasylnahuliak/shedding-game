import type {
  BackendMessageCode,
  ClientSocketEvent,
  ClientSocketPayloadByEvent,
} from '@shedding-game/shared';

import { safeParseClientSocketEvent } from '@shedding-game/shared';

import { roomRepository } from '@/db/repositories/roomRepository';
import type { Room } from '@/types';

import { scheduleBotTurn } from './bot';
import { resolveDeadlockIfNeeded } from './game';
import { emitSocketError } from './messages';
import { withRoomLock } from './roomMutex';
import { saveRoomWithAutoArchive } from './roomPersistence';
import { broadcastRoomNotice, broadcastRoomUpdate } from './socketBroadcasts';
import type { AppSocket, LockedRoomMutationResult } from './socketTypes';

export const createSocketConnectionHelpers = (socket: AppSocket) => {
  const parseSocketEvent = <TEvent extends ClientSocketEvent>(
    event: TEvent,
    raw: unknown
  ): ClientSocketPayloadByEvent[TEvent] | null => {
    const parsed = safeParseClientSocketEvent(event, raw);
    return parsed.success ? (parsed.output as ClientSocketPayloadByEvent[TEvent]) : null;
  };

  const runParsedRoomAction = async <TEvent extends ClientSocketEvent, TResult>(
    event: TEvent,
    raw: unknown,
    action: (payload: ClientSocketPayloadByEvent[TEvent], userId: string) => Promise<TResult>
  ): Promise<TResult | null> => {
    const payload = parseSocketEvent(event, raw);
    if (!payload) {
      return null;
    }

    return action(payload, socket.data.userId);
  };

  const broadcastUpdatedRoomResult = async (
    updatedRoom: Room | null,
    shouldScheduleNext: boolean,
    scheduleNext: (room: Room) => void,
    deadlockResolved = false
  ) => {
    if (!updatedRoom) {
      return;
    }

    await broadcastRoomUpdate(updatedRoom);
    if (deadlockResolved) {
      await broadcastRoomNotice(updatedRoom.id, 'GAME_DEADLOCK_RESOLVED');
    }
    if (shouldScheduleNext) {
      scheduleNext(updatedRoom);
    }
  };

  const loadHostRoomOrEmit = async (
    roomId: string,
    locale: typeof socket.data.locale,
    deniedCode: BackendMessageCode
  ): Promise<Room | null> => {
    const room = await roomRepository.loadRoom(roomId);
    if (!room) {
      return null;
    }

    if (room.hostId !== socket.data.userId) {
      emitSocketError(socket, locale, deniedCode);
      return null;
    }

    return room;
  };

  const runLockedRoomMutation = async (
    roomId: string,
    mutate: (room: Room) => Promise<boolean> | boolean
  ): Promise<LockedRoomMutationResult | null> => {
    return withRoomLock(roomId, async () => {
      const room = await roomRepository.loadRoom(roomId);
      if (!room) {
        return null;
      }

      const previousStatus = room.gameStatus;
      const shouldPersist = await mutate(room);
      if (!shouldPersist) {
        return null;
      }

      const deadlockResolved = resolveDeadlockIfNeeded(room);
      await saveRoomWithAutoArchive(room, previousStatus);
      return { room, deadlockResolved };
    });
  };

  const runRoomMutationAndContinueTurn = async (
    roomId: string,
    errorCode: BackendMessageCode,
    mutate: (room: Room) => boolean
  ) => {
    const updatedRoom = await runLockedRoomMutation(roomId, (room) => {
      if (!mutate(room)) {
        emitSocketError(socket, socket.data.locale, errorCode);
        return false;
      }

      return true;
    });

    if (!updatedRoom) {
      return;
    }

    await broadcastRoomUpdate(updatedRoom.room);
    if (updatedRoom.deadlockResolved) {
      await broadcastRoomNotice(updatedRoom.room.id, 'GAME_DEADLOCK_RESOLVED');
    }
    scheduleBotTurn(updatedRoom.room);
  };

  return {
    parseSocketEvent,
    runParsedRoomAction,
    broadcastUpdatedRoomResult,
    loadHostRoomOrEmit,
    runLockedRoomMutation,
    runRoomMutationAndContinueTurn,
  };
};

export type SocketConnectionHelpers = ReturnType<typeof createSocketConnectionHelpers>;
