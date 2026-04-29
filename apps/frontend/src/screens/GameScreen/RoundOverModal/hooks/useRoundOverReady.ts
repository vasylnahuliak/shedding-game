import { SCORE_ELIMINATION_THRESHOLD } from '@shedding-game/shared';

import type { Player } from '@/types/rooms';

export function useRoundOverReady(
  players: Player[],
  currentUserId: string,
  readyForNextRoundPlayerIds: string[]
) {
  const activePlayers = players.filter(
    (p) => !p.isLeaver && (p.score ?? 0) < SCORE_ELIMINATION_THRESHOLD
  );
  const isReady = readyForNextRoundPlayerIds.includes(currentUserId);
  const allReady =
    activePlayers.length > 0 &&
    activePlayers.every((p) => readyForNextRoundPlayerIds.includes(p.id));

  return { activePlayers, isReady, allReady };
}
