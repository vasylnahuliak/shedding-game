import crypto from 'crypto';
import type { Request, Response } from 'express';

import {
  canAccessAdmin,
  CreateRoomBodySchema,
  DEFAULT_GAME_PACE,
  formatBackendMessage,
  MAX_PLAYERS,
  MAX_ROOMS_PER_HOST,
  safeParseWithSchema,
} from '@shedding-game/shared';

import { roomRepository } from '@/db/repositories/roomRepository';
import { scheduleBotTurnAfterDeal } from '@/services/bot';
import { dealCards, resolveDeadlockIfNeeded } from '@/services/game';
import { apiError } from '@/services/messages';
import { archiveClosedGame, getSanitizedRoom } from '@/services/room';
import { withRoomLock, withUserLock } from '@/services/roomMutex';
import { saveRoomWithAutoArchive } from '@/services/roomPersistence';
import {
  broadcastRoomClosed,
  broadcastRoomNotice,
  broadcastRooms,
  broadcastRoomUpdate,
} from '@/services/socket';
import type { AuthedRequest, Room } from '@/types';

import {
  applyRoomResultOrRespond,
  assertRoomHost,
  err,
  getRoomRequestContext,
  leaveCurrentWaitingRoom,
  type MessageParams,
  mutateRoomAndPersist,
  withLockedRoom,
} from './rooms.shared';

export const createRoom = async (req: Request, res: Response) => {
  const { userId, userName, locale, roles } = req as AuthedRequest;

  await withUserLock(userId, async () => {
    await leaveCurrentWaitingRoom(userId, locale);

    const hostedRoomsCount = await roomRepository.countActiveRoomsByHost(userId);
    if (hostedRoomsCount >= MAX_ROOMS_PER_HOST) {
      apiError(res, locale, 400, 'ROOM_HOST_LIMIT_REACHED');
      return;
    }

    const bodyResult = safeParseWithSchema(CreateRoomBodySchema, req.body);
    if (!bodyResult.success) {
      apiError(res, locale, 400, 'ROOM_INVALID_CREATE_REQUEST');
      return;
    }

    const rawName = bodyResult.output.name ?? '';
    const requestedGamePace = bodyResult.output.gamePace ?? DEFAULT_GAME_PACE;
    if (requestedGamePace === 'debug' && !canAccessAdmin({ roles })) {
      apiError(res, locale, 400, 'ROOM_INVALID_CREATE_REQUEST');
      return;
    }

    const room: Room = {
      id: crypto.randomUUID(),
      name: rawName || formatBackendMessage(locale, 'ROOM_DEFAULT_NAME', { userName }),
      hostId: userId,
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
      turnStartedAt: undefined,
      gamePace: requestedGamePace,
      debugMode: bodyResult.output.debugMode,
      players: [
        {
          id: userId,
          name: userName,
          playerType: 'human',
          hand: [],
          score: 0,
        },
      ],
      deck: [],
      discardPile: [],
      currentPlayerIndex: 0,
      gameStatus: 'waiting',
      penaltyCardsCount: 0,
      activeSuit: null,
      hasDrawnThisTurn: false,
      scoreHistory: [],
      reshuffleCount: 0,
      bridgeAvailable: false,
      bridgePlayerId: null,
      bridgeLastCards: null,
      isOpeningTurn: false,
    };

    await withRoomLock(room.id, async () => {
      await roomRepository.saveRoom(room);
    });

    res.status(201).json(getSanitizedRoom(room, userId));
  });

  await broadcastRooms();
};

export const joinRoom = async (req: Request, res: Response) => {
  const { userId, userName, locale } = req as AuthedRequest;
  const roomId = String(req.params.roomId);

  const result = await withUserLock(userId, async () => {
    await leaveCurrentWaitingRoom(userId, locale, roomId);

    return withLockedRoom<Room>(roomId, async (room) => {
      const existingPlayer = room.players.find((player) => player.id === userId);
      if (existingPlayer) {
        return { ok: true, value: room };
      }

      if (room.gameStatus !== 'waiting') {
        return err(403, 'ROOM_ACCESS_DENIED');
      }

      if (room.players.length >= MAX_PLAYERS) {
        return err(400, 'ROOM_FULL');
      }

      return mutateRoomAndPersist(room, () => {
        room.players.push({
          id: userId,
          name: userName,
          playerType: 'human',
          hand: [],
          score: 0,
        });
      });
    });
  });

  if (!applyRoomResultOrRespond(locale, res, result)) {
    return;
  }

  res.json(getSanitizedRoom(result.value, userId));
  await broadcastRooms();
  await broadcastRoomUpdate(result.value);
};

export const startGame = async (req: Request, res: Response) => {
  const context = getRoomRequestContext(req);
  const result = await withLockedRoom<{ room: Room; deadlockResolved: boolean }>(
    context.roomId,
    async (room) => {
      const hostError = assertRoomHost(room, context.userId, 'ROOM_ACCESS_DENIED');
      if (hostError) {
        return hostError;
      }

      const previousStatus = room.gameStatus;
      dealCards(room);
      const deadlockResolved = resolveDeadlockIfNeeded(room);
      await saveRoomWithAutoArchive(room, previousStatus);

      return {
        ok: true,
        value: {
          room,
          deadlockResolved,
        },
      };
    }
  );

  if (!applyRoomResultOrRespond(context.locale, res, result)) {
    return;
  }

  res.json(getSanitizedRoom(result.value.room, context.userId));
  await broadcastRoomUpdate(result.value.room);
  if (result.value.deadlockResolved) {
    await broadcastRoomNotice(result.value.room.id, 'GAME_DEADLOCK_RESOLVED');
  }
  scheduleBotTurnAfterDeal(result.value.room);
};

export const leaveRoom = async (req: Request, res: Response) => {
  const { userId, locale } = req as AuthedRequest;
  const roomId = String(req.params.roomId);

  const result = await withLockedRoom<{ closed: true } | { closed: false; room: Room }>(
    roomId,
    async (room) => {
      const playerIndex = room.players.findIndex((player) => player.id === userId);
      if (playerIndex === -1) {
        return err(400, 'ROOM_NOT_IN_ROOM');
      }

      const isHost = room.hostId === userId;
      if (isHost && room.gameStatus === 'waiting') {
        broadcastRoomClosed(room.id, 'ROOM_CLOSED_HOST_LEFT', undefined, locale);
        await archiveClosedGame(room, 'ROOM_CLOSED_HOST_LEFT');
        await roomRepository.deleteRoom(room.id);
        return { ok: true, value: { closed: true } };
      }

      const previousStatus = room.gameStatus;

      if (room.gameStatus === 'finished') {
        room.players[playerIndex].isLeaver = true;
        room.players[playerIndex].leaveReason = 'voluntary';
      } else {
        room.players.splice(playerIndex, 1);
      }

      await saveRoomWithAutoArchive(room, previousStatus);
      return { ok: true, value: { closed: false, room } };
    }
  );

  if (!result.ok) {
    apiError(
      res,
      locale,
      result.status,
      result.code,
      result.params as MessageParams<typeof result.code> | undefined
    );
    return;
  }

  if (result.value.closed) {
    res.json({ closed: true });
    await broadcastRooms();
    return;
  }

  res.json({ closed: false });
  await broadcastRooms();
  await broadcastRoomUpdate(result.value.room);
};
