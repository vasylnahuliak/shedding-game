import type {
  AppLocale,
  BackendMessageCode,
  BackendMessageParamsByCode,
} from '@shedding-game/shared';
import type { Request, Response } from 'express';

import { roomRepository } from '@/db/repositories/roomRepository';
import { apiError } from '@/services/messages';
import { archiveClosedGame, canAccessRoom, getSanitizedRoom } from '@/services/room';
import { withRoomLock } from '@/services/roomMutex';
import { saveRoomWithAutoArchive } from '@/services/roomPersistence';
import { broadcastRoomClosed, broadcastRooms, broadcastRoomUpdate } from '@/services/socket';
import type { AuthedRequest, Room } from '@/types';

export type MessageParams<Code extends BackendMessageCode> = Exclude<
  BackendMessageParamsByCode[Code],
  undefined
>;

type RoomErrorResult = {
  ok: false;
  status: number;
  code: BackendMessageCode;
  params?: Record<string, string | number>;
};

type RoomResult<T> = { ok: true; value: T } | RoomErrorResult;
type RoomRequestContext = { userId: string; roomId: string; locale: AppLocale };
type RoomActionResponseOptions = {
  broadcastRooms?: boolean;
  scheduleBotAfterDeal?: boolean;
};

export const err = <Code extends BackendMessageCode>(
  status: number,
  code: Code,
  params?: MessageParams<Code>
): RoomResult<never> => {
  const result: RoomErrorResult = {
    ok: false,
    status,
    code,
  };

  if (params !== undefined) {
    result.params = params as Record<string, string | number>;
  }

  return result;
};

export const assertRoomHost = (
  room: Room,
  userId: string,
  deniedCode: BackendMessageCode
): RoomResult<never> | null => (room.hostId === userId ? null : err(403, deniedCode));

export const withLockedRoom = async <T>(
  roomId: string,
  action: (room: Room) => Promise<RoomResult<T>>
): Promise<RoomResult<T>> => {
  return withRoomLock(roomId, async () => {
    const room = await roomRepository.loadRoom(roomId);
    if (!room) {
      return err(404, 'ROOM_NOT_FOUND');
    }

    return action(room);
  });
};

export const getRoomRequestContext = (req: Request): RoomRequestContext => ({
  userId: (req as AuthedRequest).userId,
  roomId: String(req.params.roomId),
  locale: (req as AuthedRequest).locale,
});

export const mutateRoomAndPersist = async (
  room: Room,
  mutate: (room: Room) => void | Promise<void>
): Promise<RoomResult<Room>> => {
  const previousStatus = room.gameStatus;
  await mutate(room);
  await saveRoomWithAutoArchive(room, previousStatus);
  return { ok: true, value: room };
};

export const applyRoomResultOrRespond = <T>(
  locale: AppLocale,
  res: Response,
  result: RoomResult<T>
): result is { ok: true; value: T } => {
  if (result.ok) {
    return true;
  }

  apiError(
    res,
    locale,
    result.status,
    result.code,
    result.params as MessageParams<typeof result.code> | undefined
  );
  return false;
};

const sendRoomResponse = async (
  res: Response,
  room: Room,
  userId: string,
  options?: RoomActionResponseOptions
) => {
  res.json(getSanitizedRoom(room, userId));
  if (options?.broadcastRooms) {
    await broadcastRooms();
  }

  await broadcastRoomUpdate(room);
};

export const handleRoomActionWithResponse = async (
  req: Request,
  res: Response,
  action: (room: Room, context: RoomRequestContext) => Promise<RoomResult<Room>>,
  options?: RoomActionResponseOptions
) => {
  const context = getRoomRequestContext(req);
  const result = await withLockedRoom<Room>(context.roomId, async (room) => action(room, context));
  if (!applyRoomResultOrRespond(context.locale, res, result)) {
    return;
  }

  await sendRoomResponse(res, result.value, context.userId, options);
};

export const handleHostRoomActionWithResponse = async (
  req: Request,
  res: Response,
  action: (room: Room, context: RoomRequestContext) => Promise<RoomResult<Room>>,
  options?: RoomActionResponseOptions
) => {
  await handleRoomActionWithResponse(
    req,
    res,
    async (room, context) => {
      const hostError = assertRoomHost(room, context.userId, 'ROOM_ACCESS_DENIED');
      if (hostError) {
        return hostError;
      }

      return action(room, context);
    },
    options
  );
};

export const handleHostBotActionWithResponse = async (
  req: Request,
  res: Response,
  hostDeniedCode: 'ROOM_ONLY_HOST_REMOVE_BOTS' | 'ROOM_ONLY_HOST_RENAME_BOTS',
  action: (room: Room, context: RoomRequestContext, botId: string) => Promise<RoomResult<Room>>,
  options?: RoomActionResponseOptions
) => {
  const botId = String(req.params.botId);

  await handleRoomActionWithResponse(
    req,
    res,
    async (room, context) => {
      const hostError = assertRoomHost(room, context.userId, hostDeniedCode);
      if (hostError) {
        return hostError;
      }

      return action(room, context, botId);
    },
    options
  );
};

export const leaveCurrentWaitingRoom = async (
  userId: string,
  locale: AppLocale,
  exceptRoomId?: string
) => {
  const existingRoom = await roomRepository.findWaitingRoomByPlayer(userId);
  if (!existingRoom) return;
  if (exceptRoomId && existingRoom.id === exceptRoomId) return;

  let shouldBroadcastRooms = false;

  await withRoomLock(existingRoom.id, async () => {
    const currentRoom = await roomRepository.loadRoom(existingRoom.id);
    if (!currentRoom || currentRoom.gameStatus !== 'waiting') {
      return;
    }

    const playerIndex = currentRoom.players.findIndex((player) => player.id === userId);
    if (playerIndex === -1) {
      return;
    }

    const isHost = currentRoom.hostId === userId;
    if (isHost) {
      broadcastRoomClosed(currentRoom.id, 'ROOM_CLOSED_HOST_LEFT', undefined, locale);
      await archiveClosedGame(currentRoom, 'ROOM_CLOSED_HOST_LEFT');
      await roomRepository.deleteRoom(currentRoom.id);
      shouldBroadcastRooms = true;
      return;
    }

    currentRoom.players.splice(playerIndex, 1);
    await roomRepository.saveRoom(currentRoom);
    shouldBroadcastRooms = true;
    await broadcastRoomUpdate(currentRoom);
  });

  if (shouldBroadcastRooms) {
    await broadcastRooms();
  }
};

export const getAccessibleRoomOrRespond = async (
  req: Request,
  res: Response
): Promise<Room | null> => {
  const { userId, locale } = req as AuthedRequest;
  const roomId = String(req.params.roomId);
  const room = await roomRepository.loadRoom(roomId);
  if (!room) {
    apiError(res, locale, 404, 'ROOM_NOT_FOUND');
    return null;
  }

  if (!canAccessRoom(room, userId)) {
    apiError(res, locale, 403, 'ROOM_ACCESS_DENIED');
    return null;
  }

  return room;
};
