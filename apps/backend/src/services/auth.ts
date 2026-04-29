import type { AuthUser } from '@shedding-game/shared';

import { AuthUserSchema, parseWithSchema } from '@shedding-game/shared';

import type { User } from '@/types';

export const sanitizeUser = (user: User): AuthUser => {
  return parseWithSchema(AuthUserSchema, {
    id: user.id,
    name: user.name,
    email: user.email,
    locale: user.locale,
    hapticsEnabled: user.hapticsEnabled,
    discardPileExpandedByDefault: user.discardPileExpandedByDefault,
    roles: user.roles,
    emojiPreferences: user.emojiPreferences,
  });
};
