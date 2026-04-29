import type { AppLocale, BackendMessageCode } from '@shedding-game/shared';

import { DEFAULT_LOCALE } from '@shedding-game/shared';

import type { Room } from '@/types';

import { buildMessage } from './messages';
import { getRoomsList, getSanitizedRoom } from './room';
import { emitServerSocketEvent } from './socketEvents';
import { getSocketServer } from './socketRuntime';
import { scheduleDealCardsIfReady, scheduleTurnTimeout } from './socketScheduling';
import type { AppSocketServer, MessageParams } from './socketTypes';

type RoomMemberSocket = Awaited<
  ReturnType<ReturnType<AppSocketServer['in']>['fetchSockets']>
>[number];

const forEachRoomSocket = async (
  roomId: string,
  action: (socket: RoomMemberSocket) => void | Promise<void>
) => {
  const socketServer = getSocketServer();
  if (!socketServer) {
    return false;
  }

  const sockets = await socketServer.in(roomId).fetchSockets();
  for (const socket of sockets) {
    await action(socket);
  }

  return true;
};

export const broadcastRooms = async () => {
  const socketServer = getSocketServer();
  if (!socketServer) {
    return;
  }

  const sockets = await socketServer.fetchSockets();
  for (const socket of sockets) {
    emitServerSocketEvent(socket, 'rooms_updated', {
      rooms: await getRoomsList(socket.data.userId),
    });
  }
};

export const disconnectUserSockets = async (userId: string): Promise<void> => {
  const socketServer = getSocketServer();
  if (!socketServer) {
    return;
  }

  const sockets = await socketServer.fetchSockets();
  for (const socket of sockets) {
    if (socket.data.userId === userId) {
      socket.disconnect(true);
    }
  }
};

export const broadcastRoomUpdate = async (room: Room) => {
  const socketServer = getSocketServer();
  if (socketServer) {
    const sockets = await socketServer.in(room.id).fetchSockets();
    const onlineUserIds = new Set<string>();

    for (const socket of sockets) {
      onlineUserIds.add(socket.data.userId);
    }

    for (const socket of sockets) {
      emitServerSocketEvent(
        socket,
        'room_updated',
        getSanitizedRoom(room, socket.data.userId, onlineUserIds)
      );
    }
  }

  scheduleDealCardsIfReady(room);
  scheduleTurnTimeout(room);
};

export const broadcastRoomNotice = async <Code extends BackendMessageCode>(
  roomId: string,
  code: Code,
  params?: MessageParams<Code>
) => {
  await forEachRoomSocket(roomId, (socket) => {
    emitServerSocketEvent(socket, 'game_notice', buildMessage(socket.data.locale, code, params));
  });
};

export const broadcastRoomClosed = <Code extends BackendMessageCode>(
  roomId: string,
  reasonCode: Code,
  reasonParams?: MessageParams<Code>,
  locale: AppLocale = DEFAULT_LOCALE
) => {
  const socketServer = getSocketServer();
  if (!socketServer) {
    return;
  }

  const reason = buildMessage(locale, reasonCode, reasonParams);
  emitServerSocketEvent(socketServer.in(roomId), 'room_closed', {
    roomId,
    reasonCode: reason.code,
    reasonParams: reason.params,
    reasonMessage: reason.message,
  });
};

export const broadcastPlayerKicked = async (
  roomId: string,
  playerId: string,
  reason: 'host' | 'timeout'
) => {
  await forEachRoomSocket(roomId, (socket) => {
    if (socket.data.userId === playerId) {
      emitServerSocketEvent(socket, 'player_kicked', { roomId, reason });
      socket.leave(roomId);
    }
  });
};
