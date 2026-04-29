import { Router } from 'express';

import { getMyStats } from '@/controllers/stats';
import { requireAuth } from '@/middleware/auth';

const router = Router();

router.use(requireAuth());

router.get('/me', getMyStats);

export default router;
