import { useGameScreenStore } from '@/hooks';
import { useAuth } from '@/hooks/useAuthStore';
import { useAppTranslation } from '@/i18n';
import type { Player } from '@/types/rooms';

const EMPTY_PLAYERS: Player[] = [];

export const useGameSummaryModalData = (namespaces: Parameters<typeof useAppTranslation>[0]) => {
  const { t } = useAppTranslation(namespaces);
  const room = useGameScreenStore((state) => state.room);
  const user = useAuth((state) => state.user);

  return {
    t,
    room,
    user,
    players: room?.players ?? EMPTY_PLAYERS,
    scoreHistory: room?.scoreHistory ?? [],
    discardPile: room?.discardPile ?? [],
    reshuffleCount: room?.reshuffleCount || 0,
  };
};
