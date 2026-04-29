import { canAccessAdmin } from '@shedding-game/shared';

import { useAuth } from './useAuthStore';

export const useCanAccessAdmin = () => useAuth((state) => canAccessAdmin(state.user));
