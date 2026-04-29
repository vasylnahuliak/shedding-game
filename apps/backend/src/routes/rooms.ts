import { Router } from 'express';

import {
  addBot,
  clearJobs,
  createRoom,
  getActiveGame,
  getAllGames,
  getJobs,
  getMyGames,
  getRoom,
  getRoomInviteLink,
  getRooms,
  joinRoom,
  kickPlayer,
  leaveRoom,
  removeBot,
  reorderPlayers,
  startGame,
  updateBotName,
  updateRoomOptions,
} from '@/controllers/rooms';
import { requireAuth } from '@/middleware/auth';
import { requireRole } from '@/middleware/roles';

const router = Router();

router.use(requireAuth());

router.post('/', createRoom);
router.get('/', getRooms);
router.get('/games/active', getActiveGame);
router.get('/games/mine', getMyGames);
router.get('/games', requireRole('admin'), getAllGames);
router.get('/jobs', requireRole('admin'), getJobs);
router.delete('/jobs', requireRole('admin'), clearJobs);
router.get('/:roomId', getRoom);
router.patch('/:roomId', updateRoomOptions);
router.post('/:roomId/invitations', getRoomInviteLink);
router.post('/:roomId/players', joinRoom);
router.delete('/:roomId/players/me', leaveRoom);
router.delete('/:roomId/players/:playerId', kickPlayer);
router.put('/:roomId/players/order', reorderPlayers);
router.post('/:roomId/games', startGame);
router.post('/:roomId/bots', addBot);
router.patch('/:roomId/bots/:botId', updateBotName);
router.delete('/:roomId/bots/:botId', removeBot);

export default router;
