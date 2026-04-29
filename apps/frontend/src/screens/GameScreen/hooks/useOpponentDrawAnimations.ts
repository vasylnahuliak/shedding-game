import { useCallback } from 'react';

import { measureInWindowAsync } from '@/utils/measureInWindow';

import { OPPONENT_DRAW_STAGGER_DELAY } from '../CardAnimationLayer';
import { OPPONENT_DRAW_DURATION } from '../CardAnimationLayer/CardAnimationLayer.settings';
import type { GameLayoutMetrics } from '../gameLayout';

import type { OpponentDraw } from './animationDetection';
import {
  LAYOUT_SETTLE_DELAY,
  measureDeckOrigin,
  SAFETY_TIMEOUT_BUFFER,
} from './animationMeasurement';
import type {
  AnimationLayerRef,
  OpponentRefsRef,
  PromiseQueueRef,
  QueueBatch,
  ViewRef,
} from './cardAnimationRefs';
import {
  buildDrawDeltaMap,
  getStaggeredBatchDuration,
  runQueuedAnimationTask,
} from './cardAnimationUtils';
import { useOpponentDrawState } from './useOpponentDrawState';

type UseOpponentDrawAnimationsParams = {
  animationLayerRef: AnimationLayerRef;
  gameWrapperRef: ViewRef;
  deckRef: ViewRef;
  opponentRefs: OpponentRefsRef;
  drawQueueRef: PromiseQueueRef;
  layoutMetrics: GameLayoutMetrics;
  isGenerationActive: (generation: number) => boolean;
  queueBatch: QueueBatch;
};

export function useOpponentDrawAnimations({
  animationLayerRef,
  gameWrapperRef,
  deckRef,
  opponentRefs,
  drawQueueRef,
  layoutMetrics,
  isGenerationActive,
  queueBatch,
}: UseOpponentDrawAnimationsParams) {
  const {
    pendingOpponentDrawCountByPlayerId,
    applyOpponentDrawDeltas,
    revealOpponentDraws,
    resetOpponentDrawState,
  } = useOpponentDrawState();

  const scheduleOpponentDraw = useCallback(
    (draws: OpponentDraw[], options?: { startDelay?: number }) => {
      if (draws.length === 0) return;

      applyOpponentDrawDeltas(buildDrawDeltaMap(draws, 1));

      queueBatch(drawQueueRef, async (generation) => {
        await runQueuedAnimationTask({
          generation,
          delayMs: (options?.startDelay ?? 0) + LAYOUT_SETTLE_DELAY,
          isGenerationActive,
          getLayer: () => animationLayerRef.current,
          onMissingLayer: () => revealOpponentDraws(draws),
          onError: () => revealOpponentDraws(draws),
          run: async (animationLayer) => {
            const { wrapperPos, fromX, fromY } = await measureDeckOrigin(
              gameWrapperRef,
              deckRef,
              layoutMetrics.card
            );
            if (!isGenerationActive(generation)) return;

            const measuredEntries = await Promise.all(
              draws.map(async (draw) => {
                const view = opponentRefs.current.get(draw.playerId);
                if (!view) return { draw, position: null };

                try {
                  const position = await measureInWindowAsync({ current: view });
                  return { draw, position };
                } catch {
                  return { draw, position: null };
                }
              })
            );

            if (!isGenerationActive(generation)) return;

            await new Promise<void>((resolve) => {
              let dispatched = 0;
              let completed = 0;
              let settled = false;
              let totalDelay = 0;
              let fallbackTimeout: ReturnType<typeof setTimeout> | null = null;
              const remainingByPlayerId = draws.reduce<Record<string, number>>((acc, draw) => {
                acc[draw.playerId] = (acc[draw.playerId] ?? 0) + draw.count;
                return acc;
              }, {});

              const finish = () => {
                if (settled) return;
                settled = true;
                if (fallbackTimeout) clearTimeout(fallbackTimeout);

                const unresolvedDraws = Object.entries(remainingByPlayerId).map(
                  ([playerId, count]) => ({ playerId, count })
                );

                if (unresolvedDraws.length > 0) {
                  revealOpponentDraws(unresolvedDraws);
                }

                resolve();
              };

              const markDone = (playerId: string) => {
                if (remainingByPlayerId[playerId]) {
                  remainingByPlayerId[playerId] -= 1;
                  if (remainingByPlayerId[playerId] <= 0) {
                    delete remainingByPlayerId[playerId];
                  }
                  applyOpponentDrawDeltas({ [playerId]: -1 });
                }

                completed += 1;
                if (completed >= dispatched) {
                  finish();
                }
              };

              measuredEntries.forEach(({ draw, position }) => {
                if (!position) {
                  delete remainingByPlayerId[draw.playerId];
                  revealOpponentDraws([draw]);
                  return;
                }

                const toX = position.x - wrapperPos.x + (position.w - layoutMetrics.card.width) / 2;
                const toY =
                  position.y - wrapperPos.y + (position.h - layoutMetrics.card.height) / 2;

                for (let index = 0; index < draw.count; index++) {
                  dispatched += 1;
                  animationLayer.animateOpponentDraw({
                    fromX,
                    fromY,
                    toX,
                    toY,
                    delay: totalDelay,
                    onComplete: () => markDone(draw.playerId),
                  });
                  totalDelay += OPPONENT_DRAW_STAGGER_DELAY;
                }
              });

              if (dispatched === 0) {
                finish();
                return;
              }

              fallbackTimeout = setTimeout(
                finish,
                getStaggeredBatchDuration(
                  dispatched,
                  OPPONENT_DRAW_STAGGER_DELAY,
                  OPPONENT_DRAW_DURATION
                ) + SAFETY_TIMEOUT_BUFFER
              );
            });
          },
        });
      });
    },
    [
      animationLayerRef,
      applyOpponentDrawDeltas,
      deckRef,
      drawQueueRef,
      gameWrapperRef,
      isGenerationActive,
      layoutMetrics,
      opponentRefs,
      queueBatch,
      revealOpponentDraws,
    ]
  );

  return {
    pendingOpponentDrawCountByPlayerId,
    resetOpponentDrawAnimations: resetOpponentDrawState,
    scheduleOpponentDraw,
  };
}
