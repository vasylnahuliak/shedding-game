import type {
  BotPersonaName,
  DebugMode,
  GameHistoryFilters,
  GameHistoryPage,
  GamePace,
} from '@shedding-game/shared';

import {
  ActiveGameNullableSchema,
  CreateRoomBodySchema,
  GameHistoryPageSchema,
  LeaveRoomResponseSchema,
  parseWithSchema,
  ReorderPlayersBodySchema,
  RoomDetailsSchema,
  RoomInviteLinkResponseSchema,
  RoomSummaryListSchema,
  UpdateBotNameBodySchema,
  UpdateRoomOptionsBodySchema,
} from '@shedding-game/shared';

import type { ActiveGame, Room, RoomDetails, RoomInviteLinkResponse } from '@/types/rooms';

import { parseApiResponse } from './contractValidation';
import { buildGameHistorySearchParams } from './gameHistorySearchParams';
import { api } from './index';

type GetGamesOptions = {
  cursor?: string;
  filters?: GameHistoryFilters;
  limit?: number;
};

const getRooms = async (): Promise<Room[]> => {
  const response = await api.get('rooms');

  return parseApiResponse(response, RoomSummaryListSchema, 'GET rooms');
};

const createRoom = async (
  name: string,
  debugMode?: DebugMode,
  gamePace?: GamePace
): Promise<RoomDetails> => {
  const body = parseWithSchema(CreateRoomBodySchema, { name, debugMode, gamePace });
  const response = await api.post('rooms', { json: body });

  return parseApiResponse(response, RoomDetailsSchema, 'POST rooms');
};

const joinRoom = async (roomId: string): Promise<RoomDetails> => {
  const response = await api.post(`rooms/${roomId}/players`);

  return parseApiResponse(response, RoomDetailsSchema, 'POST rooms/:roomId/players');
};

const startGame = async (roomId: string): Promise<RoomDetails> => {
  const response = await api.post(`rooms/${roomId}/games`);

  return parseApiResponse(response, RoomDetailsSchema, 'POST rooms/:roomId/games');
};

const getRoom = async (roomId: string): Promise<RoomDetails> => {
  const response = await api.get(`rooms/${roomId}`);

  return parseApiResponse(response, RoomDetailsSchema, 'GET rooms/:roomId');
};

const addBot = async (roomId: string): Promise<RoomDetails> => {
  const response = await api.post(`rooms/${roomId}/bots`);

  return parseApiResponse(response, RoomDetailsSchema, 'POST rooms/:roomId/bots');
};

const removeBot = async (roomId: string, botId: string): Promise<RoomDetails> => {
  const response = await api.delete(`rooms/${roomId}/bots/${botId}`);

  return parseApiResponse(response, RoomDetailsSchema, 'DELETE rooms/:roomId/bots/:botId');
};

const updateBotName = async (
  roomId: string,
  botId: string,
  name: BotPersonaName
): Promise<RoomDetails> => {
  const body = parseWithSchema(UpdateBotNameBodySchema, { name });
  const response = await api.patch(`rooms/${roomId}/bots/${botId}`, { json: body });

  return parseApiResponse(response, RoomDetailsSchema, 'PATCH rooms/:roomId/bots/:botId');
};

const kickPlayer = async (roomId: string, playerId: string): Promise<RoomDetails> => {
  const response = await api.delete(`rooms/${roomId}/players/${playerId}`);

  return parseApiResponse(response, RoomDetailsSchema, 'DELETE rooms/:roomId/players/:playerId');
};

const leaveRoom = async (roomId: string): Promise<{ closed: boolean }> => {
  const response = await api.delete(`rooms/${roomId}/players/me`);

  return parseApiResponse(response, LeaveRoomResponseSchema, 'DELETE rooms/:roomId/players/me');
};

const getInviteLink = async (roomId: string): Promise<RoomInviteLinkResponse> => {
  const response = await api.post(`rooms/${roomId}/invitations`);

  return parseApiResponse(response, RoomInviteLinkResponseSchema, 'POST rooms/:roomId/invitations');
};

const getActiveGame = async (): Promise<ActiveGame | null> => {
  const response = await api.get('rooms/games/active');

  return parseApiResponse(response, ActiveGameNullableSchema, 'GET rooms/games/active');
};

const getAllGames = async (options: GetGamesOptions = {}): Promise<GameHistoryPage> => {
  const response = await api.get('rooms/games', {
    searchParams: buildGameHistorySearchParams(options),
  });

  return parseApiResponse(response, GameHistoryPageSchema, 'GET rooms/games');
};

const getMyGames = async (options: GetGamesOptions = {}): Promise<GameHistoryPage> => {
  const response = await api.get('rooms/games/mine', {
    searchParams: buildGameHistorySearchParams(options),
  });

  return parseApiResponse(response, GameHistoryPageSchema, 'GET rooms/games/mine');
};

const reorderPlayers = async (roomId: string, playerIds: string[]): Promise<RoomDetails> => {
  const body = parseWithSchema(ReorderPlayersBodySchema, { playerIds });
  const response = await api.put(`rooms/${roomId}/players/order`, { json: body });

  return parseApiResponse(response, RoomDetailsSchema, 'PUT rooms/:roomId/players/order');
};

const updateRoomOptions = async (
  roomId: string,
  name?: string,
  debugMode?: DebugMode,
  gamePace?: GamePace
): Promise<RoomDetails> => {
  const body = parseWithSchema(UpdateRoomOptionsBodySchema, { name, debugMode, gamePace });
  const response = await api.patch(`rooms/${roomId}`, { json: body });

  return parseApiResponse(response, RoomDetailsSchema, 'PATCH rooms/:roomId');
};

export const RoomsService = {
  getRooms,
  createRoom,
  joinRoom,
  startGame,
  getRoom,
  addBot,
  updateBotName,
  removeBot,
  kickPlayer,
  leaveRoom,
  getInviteLink,
  reorderPlayers,
  updateRoomOptions,
  getActiveGame,
  getAllGames,
  getMyGames,
};
