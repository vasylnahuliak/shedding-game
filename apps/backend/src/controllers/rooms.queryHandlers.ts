import type { Request, Response } from 'express';

import { parseWithSchema, RoomInviteLinkResponseSchema } from '@shedding-game/shared';

import {
  clearGameJobQueues,
  getGameJobQueueStatus,
  listGameJobDeadLetters,
} from '@/services/jobRunner';
import {
  getActiveGame as getActiveGameService,
  getGamesPage,
  getRoomsList,
  getSanitizedRoom,
} from '@/services/room';
import { createRoomInviteLink } from '@/services/smler';
import type { AuthedRequest } from '@/types';
import { resolveGameHistoryPageOptions } from '@/utils/gameHistory';

import { getAccessibleRoomOrRespond } from './rooms.shared';

export const getRooms = async (req: Request, res: Response) => {
  const userId = (req as AuthedRequest).userId;
  res.json(await getRoomsList(userId));
};

export const getAllGames = async (req: Request, res: Response) => {
  res.json(await getGamesPage(undefined, resolveGameHistoryPageOptions(req.query)));
};

export const getMyGames = async (req: Request, res: Response) => {
  const userId = (req as AuthedRequest).userId;
  res.json(await getGamesPage(userId, resolveGameHistoryPageOptions(req.query)));
};

export const getJobs = async (req: Request, res: Response) => {
  const limitRaw = Number(req.query.limit);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(200, Math.floor(limitRaw))) : 50;

  const [status, deadLetters] = await Promise.all([
    getGameJobQueueStatus(),
    listGameJobDeadLetters(limit),
  ]);

  res.json({ status, deadLetters });
};

export const clearJobs = async (_req: Request, res: Response) => {
  await clearGameJobQueues({ delayed: true, deadLetter: true });
  const status = await getGameJobQueueStatus();
  res.json({ cleared: true, status });
};

export const getActiveGame = async (req: Request, res: Response) => {
  const userId = (req as AuthedRequest).userId;
  const activeGame = await getActiveGameService(userId);
  res.json(activeGame);
};

export const getRoom = async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest;
  const room = await getAccessibleRoomOrRespond(req, res);
  if (!room) {
    return;
  }

  res.json(getSanitizedRoom(room, userId));
};

export const getRoomInviteLink = async (req: Request, res: Response) => {
  const { userId } = req as AuthedRequest;
  const roomId = String(req.params.roomId);
  const room = await getAccessibleRoomOrRespond(req, res);
  if (!room) {
    return;
  }

  try {
    const inviteLink = await createRoomInviteLink(room.id);
    res.json(parseWithSchema(RoomInviteLinkResponseSchema, inviteLink));
  } catch (error) {
    console.error('Failed to create Smler invite link', {
      roomId,
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(503).json({
      message: 'Invite link unavailable',
    });
  }
};
