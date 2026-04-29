import { useCallback, useState } from 'react';

import type { OpponentDraw } from './animationDetection';
import type { PendingOpponentDrawCounts } from './cardAnimationUtils';
import { applyPendingDrawDeltas, buildDrawDeltaMap } from './cardAnimationUtils';

export function useOpponentDrawState() {
  const [pendingOpponentDrawCountByPlayerId, setPendingOpponentDrawCountByPlayerId] =
    useState<PendingOpponentDrawCounts>({});

  const applyOpponentDrawDeltas = useCallback((deltas: Record<string, number>) => {
    if (Object.keys(deltas).length === 0) return;
    setPendingOpponentDrawCountByPlayerId((prev) => applyPendingDrawDeltas(prev, deltas));
  }, []);

  const revealOpponentDraws = useCallback(
    (draws: OpponentDraw[]) => {
      applyOpponentDrawDeltas(buildDrawDeltaMap(draws, -1));
    },
    [applyOpponentDrawDeltas]
  );

  const resetOpponentDrawState = useCallback(() => {
    setPendingOpponentDrawCountByPlayerId({});
  }, []);

  return {
    pendingOpponentDrawCountByPlayerId,
    applyOpponentDrawDeltas,
    revealOpponentDraws,
    resetOpponentDrawState,
  };
}
