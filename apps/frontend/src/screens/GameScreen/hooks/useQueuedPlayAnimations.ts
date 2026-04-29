import { useCallback, useState } from 'react';

import type { Card as CardType } from '@shedding-game/shared';

import { getCardKey } from '@/utils/card';
import { measureInWindowAsync } from '@/utils/measureInWindow';

import { OPPONENT_PLAY_STAGGER_DELAY, PLAY_STAGGER_DELAY } from '../CardAnimationLayer';
import {
  OPPONENT_PLAY_DURATION,
  PLAY_ANIMATION_DURATION,
} from '../CardAnimationLayer/CardAnimationLayer.settings';
import type { GameLayoutMetrics } from '../gameLayout';
import { calculateLayout } from '../PlayerHand/calculateLayout';

import type { OpponentPlay } from './animationDetection';
import {
  LAYOUT_SETTLE_DELAY,
  measureDiscardTarget,
  SAFETY_TIMEOUT_BUFFER,
} from './animationMeasurement';
import type {
  AnimationLayerRef,
  NumberRef,
  OpponentRefsRef,
  PromiseQueueRef,
  QueueBatch,
  ViewRef,
} from './cardAnimationRefs';
import {
  getStaggeredBatchDuration,
  mergeKeys,
  runKeyedAnimationBatch,
  runQueuedAnimationTask,
  subtractKeys,
} from './cardAnimationUtils';

type UseQueuedPlayAnimationsParams = {
  animationLayerRef: AnimationLayerRef;
  gameWrapperRef: ViewRef;
  handContainerRef: ViewRef;
  discardPileRef: ViewRef;
  discardTopCardOffsetRef: NumberRef;
  opponentRefs: OpponentRefsRef;
  playQueueRef: PromiseQueueRef;
  layoutMetrics: GameLayoutMetrics;
  isGenerationActive: (generation: number) => boolean;
  queueBatch: QueueBatch;
};

export function useQueuedPlayAnimations({
  animationLayerRef,
  gameWrapperRef,
  handContainerRef,
  discardPileRef,
  discardTopCardOffsetRef,
  opponentRefs,
  playQueueRef,
  layoutMetrics,
  isGenerationActive,
  queueBatch,
}: UseQueuedPlayAnimationsParams) {
  const [playAnimatingKeys, setPlayAnimatingKeys] = useState<Set<string>>(new Set());

  const addPlayKeys = useCallback((keys: string[]) => {
    setPlayAnimatingKeys((prev) => mergeKeys(prev, keys));
  }, []);

  const removePlayKeys = useCallback((keys: string[]) => {
    setPlayAnimatingKeys((prev) => subtractKeys(prev, keys));
  }, []);

  const resetPlayAnimations = useCallback(() => {
    setPlayAnimatingKeys(new Set());
  }, []);

  const schedulePlayerPlay = useCallback(
    (playedCards: CardType[], sortedPrevHand: CardType[]) => {
      const keys = playedCards.map(getCardKey);
      addPlayKeys(keys);

      queueBatch(playQueueRef, async (generation) => {
        await runQueuedAnimationTask({
          generation,
          delayMs: LAYOUT_SETTLE_DELAY,
          isGenerationActive,
          getLayer: () => animationLayerRef.current,
          onMissingLayer: () => removePlayKeys(keys),
          onError: () => removePlayKeys(keys),
          run: async (animationLayer) => {
            const [wrapperPos, handPos, discardPos] = await Promise.all([
              measureInWindowAsync(gameWrapperRef),
              measureInWindowAsync(handContainerRef),
              measureInWindowAsync(discardPileRef),
            ]);

            if (!isGenerationActive(generation)) return;

            const handRelX = handPos.x - wrapperPos.x;
            const handRelY = handPos.y - wrapperPos.y;
            const { offset, startLeft } = calculateLayout(
              handPos.w,
              sortedPrevHand.length,
              layoutMetrics.card
            );
            const toX = discardPos.x - wrapperPos.x + (discardTopCardOffsetRef.current ?? 0);
            const toY =
              discardPos.y - wrapperPos.y + (discardPos.h - layoutMetrics.card.height) / 2;

            await runKeyedAnimationBatch({
              keys,
              resolveKeys: removePlayKeys,
              timeoutMs:
                getStaggeredBatchDuration(
                  playedCards.length,
                  PLAY_STAGGER_DELAY,
                  PLAY_ANIMATION_DURATION
                ) + SAFETY_TIMEOUT_BUFFER,
              schedule: ({ completeKey, dropKey, markDispatched }) => {
                playedCards.forEach((card, index) => {
                  const key = getCardKey(card);
                  const cardIndex = sortedPrevHand.findIndex(
                    (candidate) => getCardKey(candidate) === key
                  );

                  if (cardIndex === -1) {
                    dropKey(key);
                    return;
                  }

                  markDispatched();
                  animationLayer.animatePlayCard({
                    card,
                    fromX: handRelX + startLeft + cardIndex * offset,
                    fromY: handRelY,
                    toX,
                    toY,
                    delay: index * PLAY_STAGGER_DELAY,
                    onComplete: () => completeKey(key),
                  });
                });
              },
            });
          },
        });
      });
    },
    [
      addPlayKeys,
      animationLayerRef,
      discardPileRef,
      discardTopCardOffsetRef,
      gameWrapperRef,
      handContainerRef,
      isGenerationActive,
      layoutMetrics,
      playQueueRef,
      queueBatch,
      removePlayKeys,
    ]
  );

  const scheduleOpponentPlay = useCallback(
    (plays: OpponentPlay[]) => {
      const keys = plays.flatMap((play) => play.cards.map(getCardKey));
      addPlayKeys(keys);

      /* jscpd:ignore-start */
      queueBatch(playQueueRef, async (generation) => {
        await runQueuedAnimationTask({
          generation,
          delayMs: LAYOUT_SETTLE_DELAY,
          isGenerationActive,
          getLayer: () => animationLayerRef.current,
          onMissingLayer: () => removePlayKeys(keys),
          onError: () => removePlayKeys(keys),
          run: async (animationLayer) => {
            const { wrapperPos, toX, toY } = await measureDiscardTarget(
              gameWrapperRef,
              discardPileRef,
              discardTopCardOffsetRef.current ?? 0,
              layoutMetrics.card
            );
            if (!isGenerationActive(generation)) return;

            const measuredPlays = await Promise.all(
              plays.map(async (play) => {
                const view = opponentRefs.current.get(play.playerId);
                if (!view) return { play, position: null };

                try {
                  const position = await measureInWindowAsync({ current: view });
                  return { play, position };
                } catch {
                  return { play, position: null };
                }
              })
            );

            if (!isGenerationActive(generation)) return;

            let totalDelay = 0;
            await runKeyedAnimationBatch({
              keys,
              resolveKeys: removePlayKeys,
              timeoutMs:
                getStaggeredBatchDuration(
                  keys.length,
                  OPPONENT_PLAY_STAGGER_DELAY,
                  OPPONENT_PLAY_DURATION
                ) + SAFETY_TIMEOUT_BUFFER,
              schedule: ({ completeKey, dropKey, markDispatched }) => {
                measuredPlays.forEach(({ play, position }) => {
                  if (!position) {
                    play.cards.map(getCardKey).forEach(dropKey);
                    return;
                  }

                  const fromX =
                    position.x - wrapperPos.x + (position.w - layoutMetrics.card.width) / 2;
                  const fromY =
                    position.y - wrapperPos.y + (position.h - layoutMetrics.card.height) / 2;

                  play.cards.forEach((card) => {
                    const key = getCardKey(card);
                    markDispatched();
                    animationLayer.animateOpponentPlayCard({
                      card,
                      fromX,
                      fromY,
                      toX,
                      toY,
                      delay: totalDelay,
                      onComplete: () => completeKey(key),
                    });
                    totalDelay += OPPONENT_PLAY_STAGGER_DELAY;
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
      addPlayKeys,
      animationLayerRef,
      discardPileRef,
      discardTopCardOffsetRef,
      gameWrapperRef,
      isGenerationActive,
      layoutMetrics,
      opponentRefs,
      playQueueRef,
      queueBatch,
      removePlayKeys,
    ]
  );

  return {
    playAnimatingKeys,
    resetPlayAnimations,
    schedulePlayerPlay,
    scheduleOpponentPlay,
  };
}
