import { Router } from 'express';

import {
  assignRole,
  listAccountDeletionRequests,
  listUsers,
  removeRole,
} from '@/controllers/admin';
import { requireAuth } from '@/middleware/auth';
import { requireRole } from '@/middleware/roles';

const router = Router();

router.use(requireAuth());
router.use(requireRole('super_admin'));

router.get('/users', listUsers);
router.get('/account-deletion-requests', listAccountDeletionRequests);
router.post('/users/:userId/roles', assignRole);
router.delete('/users/:userId/roles/:role', removeRole);

export default router;
