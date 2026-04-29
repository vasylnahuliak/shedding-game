import crypto from 'crypto';
import type { Request, Response } from 'express';

import {
  canAccessAdmin,
  MAX_PLAYERS,
  ReorderPlayersBodySchema,
  safeParseWithSchema,
  UpdateBotNameBodySchema,
  UpdateRoomOptionsBodySchema,
} from '@shedding-game/shared';

import { roomRepository } from '@/db/repositories/roomRepository';
import { applyBotPersonaName, canUseBotPersonaName, generateBotDisplayName } from '@/services/bot';
import { broadcastPlayerKicked } from '@/services/socket';
import type { AuthedRequest } from '@/types';

import {
  assertRoomHost,
  err,
  handleHostBotActionWithResponse,
  handleHostRoomActionWithResponse,
  handleRoomActionWithResponse,
  mutateRoomAndPersist,
} from './rooms.shared';

export const addBot = async (req: Request, res: Response) => {
  await handleHostRoomActionWithResponse(
    req,
    res,
    async (room) => {
      if (room.players.length >= MAX_PLAYERS) {
        return err(400, 'ROOM_FULL');
      }

      const botId = `bot-${crypto.randomUUID()}`;
      return mutateRoomAndPersist(room, () => {
        room.players.push({
          id: botId,
          name: generateBotDisplayName(room),
          playerType: 'bot',
          hand: [],
          score: 0,
        });
      });
    },
    { broadcastRooms: true }
  );
};

export const removeBot = async (req: Request, res: Response) => {
  await handleHostBotActionWithResponse(
    req,
    res,
    'ROOM_ONLY_HOST_REMOVE_BOTS',
    async (room, _context, botId) => {
      const botIndex = room.players.findIndex((player) => player.id === botId);
      if (botIndex === -1) {
        return err(404, 'ROOM_BOT_NOT_FOUND');
      }

      if (room.players[botIndex].playerType !== 'bot') {
        return err(400, 'ROOM_REMOVE_BOT_ONLY');
      }

      return mutateRoomAndPersist(room, () => {
        room.players.splice(botIndex, 1);
      });
    },
    { broadcastRooms: true }
  );
};

export const updateBotName = async (req: Request, res: Response) => {
  await handleHostBotActionWithResponse(
    req,
    res,
    'ROOM_ONLY_HOST_RENAME_BOTS',
    async (room, _context, botId) => {
      if (room.gameStatus !== 'waiting') {
        return err(400, 'ROOM_RENAME_BOT_WAITING_ONLY');
      }

      const botIndex = room.players.findIndex((player) => player.id === botId);
      if (botIndex === -1 || room.players[botIndex].playerType !== 'bot') {
        return err(404, 'ROOM_BOT_NOT_FOUND');
      }

      const bodyResult = safeParseWithSchema(UpdateBotNameBodySchema, req.body);
      if (!bodyResult.success) {
        return err(400, 'ROOM_INVALID_BOT_NAME');
      }

      const { name } = bodyResult.output;
      if (!canUseBotPersonaName(room, name, room.players[botIndex].name)) {
        return err(400, 'ROOM_BOT_NAME_TAKEN');
      }

      return mutateRoomAndPersist(room, () => {
        applyBotPersonaName(room, botId, name);
      });
    }
  );
};

export const kickPlayer = async (req: Request, res: Response) => {
  const playerId = String(req.params.playerId);

  await handleRoomActionWithResponse(
    req,
    res,
    async (room, context) => {
      const hostError = assertRoomHost(room, context.userId, 'ROOM_ONLY_HOST_KICK_PLAYERS');
      if (hostError) {
        return hostError;
      }

      if (playerId === context.userId) {
        return err(400, 'ROOM_CANNOT_KICK_SELF');
      }

      const playerIndex = room.players.findIndex((player) => player.id === playerId);
      if (playerIndex === -1) {
        return err(404, 'ROOM_PLAYER_NOT_FOUND');
      }

      const isBot = room.players[playerIndex].playerType === 'bot';
      if (!isBot) {
        await broadcastPlayerKicked(context.roomId, playerId, 'host');
      }

      return mutateRoomAndPersist(room, () => {
        room.players.splice(playerIndex, 1);
      });
    },
    { broadcastRooms: true }
  );
};

export const reorderPlayers = async (req: Request, res: Response) => {
  await handleRoomActionWithResponse(req, res, async (room, context) => {
    const hostError = assertRoomHost(room, context.userId, 'ROOM_ONLY_HOST_REORDER_PLAYERS');
    if (hostError) {
      return hostError;
    }

    if (room.gameStatus !== 'waiting') {
      return err(400, 'ROOM_REORDER_WAITING_ONLY');
    }

    const bodyResult = safeParseWithSchema(ReorderPlayersBodySchema, req.body);
    if (!bodyResult.success) {
      return err(400, 'ROOM_REORDER_PLAYER_IDS_ARRAY');
    }

    const { playerIds } = bodyResult.output;
    const currentIds = new Set(room.players.map((player) => player.id));
    const newIds = new Set(playerIds);
    if (currentIds.size !== newIds.size || ![...currentIds].every((id) => newIds.has(id))) {
      return err(400, 'ROOM_REORDER_PLAYER_IDS_INVALID');
    }

    const playerMap = new Map(room.players.map((player) => [player.id, player]));
    room.players = playerIds.map((id) => {
      const player = playerMap.get(id);
      if (!player) {
        throw new Error(`Player ${id} is missing from reorder payload.`);
      }

      return player;
    });

    await roomRepository.saveRoom(room);
    return { ok: true, value: room };
  });
};

export const updateRoomOptions = async (req: Request, res: Response) => {
  await handleRoomActionWithResponse(
    req,
    res,
    async (room, context) => {
      const { roles } = req as AuthedRequest;

      const hostError = assertRoomHost(room, context.userId, 'ROOM_ONLY_HOST_UPDATE_OPTIONS');
      if (hostError) {
        return hostError;
      }

      if (room.gameStatus !== 'waiting') {
        return err(400, 'ROOM_UPDATE_WAITING_ONLY');
      }

      const bodyResult = safeParseWithSchema(UpdateRoomOptionsBodySchema, req.body);
      if (!bodyResult.success) {
        return err(400, 'ROOM_INVALID_OPTIONS');
      }

      const { name, debugMode, gamePace } = bodyResult.output;
      if (name !== undefined && name !== '') {
        room.name = name;
      }

      if (debugMode !== undefined) {
        room.debugMode = debugMode;
      }

      if (gamePace !== undefined) {
        if (gamePace === 'debug' && !canAccessAdmin({ roles })) {
          return err(400, 'ROOM_INVALID_OPTIONS');
        }

        room.gamePace = gamePace;
      }

      await roomRepository.saveRoom(room);
      return { ok: true, value: room };
    },
    { broadcastRooms: true }
  );
};
