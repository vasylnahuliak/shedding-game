import { useCallback } from 'react';

import type { GameLayoutMetrics } from '../gameLayout';

import type {
  AnimationLayerRef,
  OpponentRefsRef,
  PromiseQueueRef,
  QueueBatch,
  ViewRef,
} from './cardAnimationRefs';
import { useOpponentDrawAnimations } from './useOpponentDrawAnimations';
import { usePlayerDrawAnimations } from './usePlayerDrawAnimations';

type UseQueuedDrawAnimationsParams = {
  animationLayerRef: AnimationLayerRef;
  gameWrapperRef: ViewRef;
  deckRef: ViewRef;
  handContainerRef: ViewRef;
  opponentRefs: OpponentRefsRef;
  drawQueueRef: PromiseQueueRef;
  layoutMetrics: GameLayoutMetrics;
  isGenerationActive: (generation: number) => boolean;
  queueBatch: QueueBatch;
};

export function useQueuedDrawAnimations({
  animationLayerRef,
  gameWrapperRef,
  deckRef,
  handContainerRef,
  opponentRefs,
  drawQueueRef,
  layoutMetrics,
  isGenerationActive,
  queueBatch,
}: UseQueuedDrawAnimationsParams) {
  const { playerDrawAnimatingKeys, resetPlayerDrawAnimations, schedulePlayerDraw } =
    usePlayerDrawAnimations({
      animationLayerRef,
      gameWrapperRef,
      deckRef,
      handContainerRef,
      drawQueueRef,
      layoutMetrics,
      isGenerationActive,
      queueBatch,
    });

  const { pendingOpponentDrawCountByPlayerId, resetOpponentDrawAnimations, scheduleOpponentDraw } =
    useOpponentDrawAnimations({
      animationLayerRef,
      gameWrapperRef,
      deckRef,
      opponentRefs,
      drawQueueRef,
      layoutMetrics,
      isGenerationActive,
      queueBatch,
    });

  const resetDrawAnimations = useCallback(() => {
    resetPlayerDrawAnimations();
    resetOpponentDrawAnimations();
  }, [resetOpponentDrawAnimations, resetPlayerDrawAnimations]);

  return {
    playerDrawAnimatingKeys,
    pendingOpponentDrawCountByPlayerId,
    resetDrawAnimations,
    schedulePlayerDraw,
    scheduleOpponentDraw,
  };
}
