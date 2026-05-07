import { safeParseClientSocketEvent, SCORE_ELIMINATION_THRESHOLD } from '@shedding-game/shared';

import { roomRepository } from '@/db/repositories/roomRepository';
import type { Room } from '@/types';

import { scheduleBotTurn } from './bot';
import { emitSocketError } from './messages';
import {
  archiveClosedGame,
  canAccessRoom,
  finishRoomIfNoActiveHumans,
  getSanitizedRoom,
  migrateHost,
} from './room';
import { withRoomLock } from './roomMutex';
import { saveRoomWithAutoArchive } from './roomPersistence';
import { broadcastRooms, broadcastRoomUpdate } from './socketBroadcasts';
import type { SocketConnectionHelpers } from './socketConnectionHelpers';
import { emitServerSocketEvent } from './socketEvents';
import { resetRoomForRecreation } from './socketRoomRecreation';
import { getSocketServer } from './socketRuntime';
import { finishGameIfHostCannotMigrate } from './socketScheduling';
import type { AppSocket } from './socketTypes';

type RegisterSocketRoomHandlersParams = {
  socket: AppSocket;
  canConsumeEvent: (event: string) => Promise<boolean>;
  helpers: SocketConnectionHelpers;
};

export const registerSocketRoomHandlers = ({
  socket,
  canConsumeEvent,
  helpers,
}: RegisterSocketRoomHandlersParams) => {
  socket.on('join_room', async (raw: unknown) => {
    if (!(await canConsumeEvent('join_room'))) return;
    const parsed = safeParseClientSocketEvent('join_room', raw);
    if (!parsed.success) return;

    const { roomId } = parsed.output;
    const { locale, userId } = socket.data;

    await withRoomLock(roomId, async () => {
      const room = await roomRepository.loadRoom(roomId);
      if (!room) {
        return;
      }

      if (!canAccessRoom(room, userId)) {
        emitSocketError(socket, locale, 'ROOM_ACCESS_DENIED');
        return;
      }

      await socket.join(roomId);
      emitServerSocketEvent(socket, 'room_updated', getSanitizedRoom(room, userId));
      await broadcastRoomUpdate(room);
    });
  });

  socket.on('leave_room', async (raw: unknown) => {
    if (!(await canConsumeEvent('leave_room'))) return;
    const parsed = safeParseClientSocketEvent('leave_room', raw);
    if (!parsed.success) return;
    await socket.leave(parsed.output.roomId);
  });

  socket.on('set_locale', async (rawLocale: unknown) => {
    if (!(await canConsumeEvent('set_locale'))) return;
    const parsed = safeParseClientSocketEvent('set_locale', rawLocale);
    if (!parsed.success) return;
    socket.data.locale = parsed.output.locale;
  });

  socket.on('delete_room', async (raw: unknown) => {
    if (!(await canConsumeEvent('delete_room'))) return;
    const payload = helpers.parseSocketEvent('delete_room', raw);
    if (!payload) return;

    const deleted = await withRoomLock(payload.roomId, async () => {
      const room = await helpers.loadHostRoomOrEmit(
        payload.roomId,
        socket.data.locale,
        'ROOM_ACCESS_DENIED'
      );
      if (!room) {
        return false;
      }

      if (room.gameStatus !== 'finished') {
        await archiveClosedGame(room, 'ROOM_CLOSED_DELETED_BY_HOST');
      }

      await roomRepository.deleteRoom(payload.roomId);
      return true;
    });

    if (deleted) {
      await broadcastRooms();
    }
  });

  socket.on('end_game', async (raw: unknown) => {
    if (!(await canConsumeEvent('end_game'))) return;
    const payload = helpers.parseSocketEvent('end_game', raw);
    if (!payload) return;

    const shouldBroadcastRooms = await withRoomLock(payload.roomId, async () => {
      const room = await helpers.loadHostRoomOrEmit(
        payload.roomId,
        socket.data.locale,
        'SOCKET_ONLY_HOST_END_GAME'
      );
      if (!room) {
        return false;
      }

      const socketServer = getSocketServer();
      if (socketServer) {
        emitServerSocketEvent(socketServer.in(payload.roomId), 'game_ended', undefined);
      }

      if (room.gameStatus !== 'finished') {
        await archiveClosedGame(room, 'ROOM_CLOSED_ENDED_BY_HOST');
      }

      await roomRepository.deleteRoom(payload.roomId);
      return true;
    });

    if (shouldBroadcastRooms) {
      await broadcastRooms();
    }
  });

  socket.on('recreate_room', async (raw: unknown) => {
    if (!(await canConsumeEvent('recreate_room'))) return;
    const parsed = safeParseClientSocketEvent('recreate_room', raw);
    if (!parsed.success) return;

    const { roomId } = parsed.output;
    const recreatedRoom = await withRoomLock(roomId, async () => {
      const room = await roomRepository.loadRoom(roomId);
      if (!room) {
        emitSocketError(socket, socket.data.locale, 'ROOM_NOT_FOUND');
        return null;
      }

      if (room.hostId !== socket.data.userId) {
        emitSocketError(socket, socket.data.locale, 'SOCKET_ONLY_HOST_RECREATE_ROOM');
        return null;
      }

      if (room.gameStartedAt && room.gameStatus !== 'finished') {
        await archiveClosedGame(room, 'ROOM_CLOSED_RECREATED_BY_HOST');
      }

      const socketServer = getSocketServer();
      const connectedUserIds = new Set<string>();

      if (socketServer) {
        const roomSockets = await socketServer.in(roomId).fetchSockets();
        for (const roomSocket of roomSockets) {
          if (roomSocket.data.userId) {
            connectedUserIds.add(roomSocket.data.userId);
          }
        }
      }

      resetRoomForRecreation(room, connectedUserIds, socketServer !== null);
      await roomRepository.saveRoom(room);
      return room;
    });

    if (!recreatedRoom) {
      return;
    }

    const socketServer = getSocketServer();
    if (socketServer) {
      emitServerSocketEvent(socketServer.in(roomId), 'room_recreated', { roomId });
    }
    await broadcastRoomUpdate(recreatedRoom);
    await broadcastRooms();
  });

  socket.on('player_leave_game', async (raw: unknown) => {
    if (!(await canConsumeEvent('player_leave_game'))) return;
    const result = await helpers.runParsedRoomAction(
      'player_leave_game',
      raw,
      async ({ roomId }, userId) =>
        withRoomLock(
          roomId,
          async (): Promise<{ updatedRoom: Room | null; shouldScheduleBot: boolean }> => {
            const room = await roomRepository.loadRoom(roomId);
            if (!room) {
              return { updatedRoom: null, shouldScheduleBot: false };
            }

            const playerIndex = room.players.findIndex((player) => player.id === userId);
            if (playerIndex === -1) {
              return { updatedRoom: null, shouldScheduleBot: false };
            }

            emitServerSocketEvent(socket, 'player_left_game', undefined);
            await socket.leave(roomId);

            const isHost = room.hostId === userId;
            const isEliminated = room.players[playerIndex].score >= SCORE_ELIMINATION_THRESHOLD;
            const previousStatus = room.gameStatus;

            if (isEliminated) {
              if (isHost) {
                migrateHost(room);
              }

              await saveRoomWithAutoArchive(room, previousStatus);
              return { updatedRoom: room, shouldScheduleBot: false };
            }

            room.players[playerIndex].isLeaver = true;
            room.players[playerIndex].leaveReason = 'voluntary';

            if (isHost && finishGameIfHostCannotMigrate(room, userId)) {
              await saveRoomWithAutoArchive(room, previousStatus);
              return { updatedRoom: room, shouldScheduleBot: false };
            }

            if (finishRoomIfNoActiveHumans(room)) {
              await saveRoomWithAutoArchive(room, previousStatus);
              return { updatedRoom: room, shouldScheduleBot: false };
            }

            if (room.gameStatus !== 'playing') {
              if (room.gameStatus === 'round_over') {
                room.readyForNextRoundPlayerIds = Array.from(
                  new Set([...(room.readyForNextRoundPlayerIds ?? []), userId])
                );
              }

              await saveRoomWithAutoArchive(room, previousStatus);
              return { updatedRoom: room, shouldScheduleBot: false };
            }

            const shouldScheduleBot = room.currentPlayerIndex === playerIndex;
            await saveRoomWithAutoArchive(room, previousStatus);
            return { updatedRoom: room, shouldScheduleBot };
          }
        )
    );
    if (!result) return;

    await helpers.broadcastUpdatedRoomResult(
      result.updatedRoom,
      result.shouldScheduleBot,
      scheduleBotTurn
    );
  });

  socket.on('disconnect', async () => {
    const affectedRooms = await roomRepository.listRoomsByPlayer(socket.data.userId);

    for (const { id: affectedRoomId } of affectedRooms) {
      await withRoomLock(affectedRoomId, async () => {
        const room = await roomRepository.loadRoom(affectedRoomId);
        if (room) {
          await broadcastRoomUpdate(room);
        }
      });
    }
  });
};
