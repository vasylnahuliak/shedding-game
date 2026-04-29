import { SCORE_ELIMINATION_THRESHOLD } from '@shedding-game/shared';

import type { Player, RoundScore } from '@/types/rooms';

/** Players whose hands should be shown: active + first-time eliminated this round. */
export const getPlayersToShowHands = (
  players: Player[],
  scoreHistory?: RoundScore[][]
): Player[] => {
  const history = scoreHistory ?? [];
  const lastRoundIndex = history.length - 1;
  const lastRound = lastRoundIndex >= 0 ? history[lastRoundIndex] : [];
  const eliminatedThisRoundIds = new Set(
    lastRound.filter((s) => s.event?.type === 'eliminated').map((s) => s.playerId)
  );
  const firstEliminatedInRoundIndex = (playerId: string) =>
    history.findIndex((round) =>
      round.some((s) => s.playerId === playerId && s.event?.type === 'eliminated')
    );
  return players.filter(
    (p) =>
      (p.score ?? 0) < SCORE_ELIMINATION_THRESHOLD ||
      (eliminatedThisRoundIds.has(p.id) && firstEliminatedInRoundIndex(p.id) === lastRoundIndex)
  );
};
