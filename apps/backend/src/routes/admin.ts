import { Router } from 'express';

import {
  assignRole,
  getUserGames,
  getUserStats,
  listAccountDeletionRequests,
  listUsers,
  removeRole,
} from '@/controllers/admin';
import { requireAuth } from '@/middleware/auth';
import { requireRole } from '@/middleware/roles';

const router = Router();

router.use(requireAuth());
router.use(requireRole('admin'));

router.get('/users', listUsers);
router.get('/users/:userId/games', getUserGames);
router.get('/users/:userId/stats', getUserStats);
router.get('/account-deletion-requests', requireRole('super_admin'), listAccountDeletionRequests);
router.post('/users/:userId/roles', requireRole('super_admin'), assignRole);
router.delete('/users/:userId/roles/:role', requireRole('super_admin'), removeRole);

export default router;
