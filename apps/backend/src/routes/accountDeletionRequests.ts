import { Router } from 'express';

import { createAccountDeletionRequest } from '@/controllers/accountDeletionRequests';

const router = Router();

router.post('/', createAccountDeletionRequest);

export default router;
