import { Router } from 'express';

import {
  deleteAccount,
  getMe,
  logout,
  updateDiscardPilePreference,
  updateEmojiPreference,
  updateHapticsPreference,
  updateLocale,
  upsertProfile,
} from '@/controllers/auth';
import { requireAuth } from '@/middleware/auth';

const router = Router();

router.post('/profile', requireAuth({ requireExistingUser: false }), upsertProfile);
router.put('/profile', requireAuth({ requireExistingUser: false }), upsertProfile);
router.delete('/profile', requireAuth(), deleteAccount);
router.get('/me', requireAuth({ requireExistingUser: false }), getMe);
router.post('/logout', requireAuth({ requireExistingUser: false }), logout);
router.put('/emoji-preference', requireAuth(), updateEmojiPreference);
router.put('/haptics-preference', requireAuth(), updateHapticsPreference);
router.put('/discard-pile-preference', requireAuth(), updateDiscardPilePreference);
router.put('/locale', requireAuth(), updateLocale);

export default router;
