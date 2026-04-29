import { useCallback } from 'react';

import type { Card as CardType } from '@shedding-game/shared';

import { getCardKey } from '@/utils/card';
import { measureInWindowAsync } from '@/utils/measureInWindow';

import { DRAW_STAGGER_DELAY } from '../CardAnimationLayer';
import { DRAW_ANIMATION_DURATION } from '../CardAnimationLayer/CardAnimationLayer.settings';
import type { GameLayoutMetrics } from '../gameLayout';
import { calculateLayout, PLAYER_HAND_SELECTED_LIFT } from '../PlayerHand/calculateLayout';

import {
  LAYOUT_SETTLE_DELAY,
  measureDeckOrigin,
  SAFETY_TIMEOUT_BUFFER,
} from './animationMeasurement';
import type { AnimationLayerRef, PromiseQueueRef, QueueBatch, ViewRef } from './cardAnimationRefs';
import {
  getStaggeredBatchDuration,
  runKeyedAnimationBatch,
  runQueuedAnimationTask,
} from './cardAnimationUtils';
import { usePlayerDrawState } from './usePlayerDrawState';

type UsePlayerDrawAnimationsParams = {
  animationLayerRef: AnimationLayerRef;
  gameWrapperRef: ViewRef;
  deckRef: ViewRef;
  handContainerRef: ViewRef;
  drawQueueRef: PromiseQueueRef;
  layoutMetrics: GameLayoutMetrics;
  isGenerationActive: (generation: number) => boolean;
  queueBatch: QueueBatch;
};

export function usePlayerDrawAnimations({
  animationLayerRef,
  gameWrapperRef,
  deckRef,
  handContainerRef,
  drawQueueRef,
  layoutMetrics,
  isGenerationActive,
  queueBatch,
}: UsePlayerDrawAnimationsParams) {
  const { playerDrawAnimatingKeys, addPlayerDrawKeys, removePlayerDrawKeys, resetPlayerDrawState } =
    usePlayerDrawState();

  const schedulePlayerDraw = useCallback(
    (
      drawnCards: CardType[],
      sortedNewHand: CardType[],
      playableKeys?: Set<string>,
      options?: { startDelay?: number }
    ) => {
      const keys = drawnCards.map(getCardKey);
      addPlayerDrawKeys(keys);

      /* jscpd:ignore-start */
      queueBatch(drawQueueRef, async (generation) => {
        await runQueuedAnimationTask({
          generation,
          delayMs: (options?.startDelay ?? 0) + LAYOUT_SETTLE_DELAY,
          isGenerationActive,
          getLayer: () => animationLayerRef.current,
          onMissingLayer: () => removePlayerDrawKeys(keys),
          onError: () => removePlayerDrawKeys(keys),
          run: async (animationLayer) => {
            const { wrapperPos, fromX, fromY } = await measureDeckOrigin(
              gameWrapperRef,
              deckRef,
              layoutMetrics.card
            );
            if (!isGenerationActive(generation)) return;

            const handPos = await measureInWindowAsync(handContainerRef);
            if (!isGenerationActive(generation)) return;

            const handRelX = handPos.x - wrapperPos.x;
            const handRelY = handPos.y - wrapperPos.y;
            const { offset, startLeft } = calculateLayout(
              handPos.w,
              sortedNewHand.length,
              layoutMetrics.card
            );

            await runKeyedAnimationBatch({
              keys,
              resolveKeys: removePlayerDrawKeys,
              timeoutMs:
                getStaggeredBatchDuration(
                  drawnCards.length,
                  DRAW_STAGGER_DELAY,
                  DRAW_ANIMATION_DURATION
                ) + SAFETY_TIMEOUT_BUFFER,
              schedule: ({ completeKey, dropKey, markDispatched }) => {
                drawnCards.forEach((card, index) => {
                  const key = getCardKey(card);
                  const cardIndex = sortedNewHand.findIndex(
                    (candidate) => getCardKey(candidate) === key
                  );

                  if (cardIndex === -1) {
                    dropKey(key);
                    return;
                  }

                  markDispatched();
                  animationLayer.animateDrawCard({
                    card,
                    fromX,
                    fromY,
                    toX: handRelX + startLeft + cardIndex * offset,
                    toY: handRelY + PLAYER_HAND_SELECTED_LIFT,
                    delay: index * DRAW_STAGGER_DELAY,
                    disabled: playableKeys ? !playableKeys.has(key) : undefined,
                    onComplete: () => completeKey(key),
                  });
                });
              },
            });
          },
        });
      });
      /* jscpd:ignore-end */
    },
    [
      addPlayerDrawKeys,
      animationLayerRef,
      deckRef,
      drawQueueRef,
      gameWrapperRef,
      handContainerRef,
      isGenerationActive,
      layoutMetrics,
      queueBatch,
      removePlayerDrawKeys,
    ]
  );

  return {
    playerDrawAnimatingKeys,
    resetPlayerDrawAnimations: resetPlayerDrawState,
    schedulePlayerDraw,
  };
}
