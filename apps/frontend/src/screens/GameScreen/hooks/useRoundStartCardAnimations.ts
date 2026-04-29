import { useCallback, useRef, useState } from 'react';

import type { Card as CardType } from '@shedding-game/shared';

import type { RoomDetails } from '@/types/rooms';
import { getCardKey } from '@/utils/card';
import { measureInWindowAsync } from '@/utils/measureInWindow';

import {
  DRAW_ANIMATION_DURATION,
  OPPONENT_DRAW_DURATION,
} from '../CardAnimationLayer/CardAnimationLayer.settings';
import type { GameLayoutMetrics } from '../gameLayout';
import { calculateLayout, PLAYER_HAND_SELECTED_LIFT } from '../PlayerHand/calculateLayout';

import {
  LAYOUT_SETTLE_DELAY,
  measureDeckOrigin,
  SAFETY_TIMEOUT_BUFFER,
} from './animationMeasurement';
import type { AnimationLayerRef, NumberRef, OpponentRefsRef, ViewRef } from './cardAnimationRefs';
import { subtractKeys } from './cardAnimationUtils';
import { sortCardsByRankDesc } from './gameSelectors';
import { ROUND_START_DEAL_STAGGER_DELAY } from './roundStartAnimation.constants';
import type { RoundStartDealEvent } from './roundStartAnimation.utils';
import { buildRoundStartDealEvents } from './roundStartAnimation.utils';
import { animateOpeningCardToDiscard } from './roundStartCardOpeningAnimation';

type UseRoundStartCardAnimationsParams = {
  animationLayerRef: AnimationLayerRef;
  gameWrapperRef: ViewRef;
  deckRef: ViewRef;
  handContainerRef: ViewRef;
  discardPileRef: ViewRef;
  discardTopCardOffsetRef: NumberRef;
  opponentRefs: OpponentRefsRef;
  layoutMetrics: GameLayoutMetrics;
};

export function useRoundStartCardAnimations({
  animationLayerRef,
  gameWrapperRef,
  deckRef,
  handContainerRef,
  discardPileRef,
  discardTopCardOffsetRef,
  opponentRefs,
  layoutMetrics,
}: UseRoundStartCardAnimationsParams) {
  const [roundStartAnimatingCardKeys, setRoundStartAnimatingCardKeys] = useState<Set<string>>(
    new Set()
  );

  const roundStartLayoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roundStartCleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roundStartFallbackTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearRoundStartTimers = useCallback(() => {
    if (roundStartLayoutTimerRef.current) {
      clearTimeout(roundStartLayoutTimerRef.current);
      roundStartLayoutTimerRef.current = null;
    }
    if (roundStartCleanupTimerRef.current) {
      clearTimeout(roundStartCleanupTimerRef.current);
      roundStartCleanupTimerRef.current = null;
    }
    roundStartFallbackTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    roundStartFallbackTimeoutsRef.current = [];
  }, []);

  const clearRoundStartAnimationState = useCallback(() => {
    clearRoundStartTimers();
    animationLayerRef.current?.clearAll();
    setRoundStartAnimatingCardKeys(new Set());
  }, [animationLayerRef, clearRoundStartTimers]);

  const hidePlayerCardsForRoundStart = useCallback(
    (room: RoomDetails, userId: string | undefined) => {
      if (!userId) return;

      const myPlayer = room.players.find((player) => player.id === userId);
      if (!myPlayer || !Array.isArray(myPlayer.hand)) return;

      setRoundStartAnimatingCardKeys(new Set(myPlayer.hand.map(getCardKey)));
    },
    []
  );

  const animateRoundStartDeal = useCallback(
    (
      updatedRoom: RoomDetails,
      userId: string | undefined,
      playableKeys?: Set<string>,
      onComplete?: () => void,
      onOpponentCardDealt?: (playerId: string) => void
    ) => {
      if (!userId) {
        onComplete?.();
        return 0;
      }

      clearRoundStartTimers();

      const { events, myCardsInDealOrder, playersByDealOrder } = buildRoundStartDealEvents(
        updatedRoom,
        userId,
        ROUND_START_DEAL_STAGGER_DELAY
      );

      const myEvents = events.filter((event): event is RoundStartDealEvent & { card: CardType } => {
        return event.playerId === userId && !!event.card;
      });
      const myKeys = myEvents.map((event) => getCardKey(event.card));
      setRoundStartAnimatingCardKeys(new Set(myKeys));

      const totalScheduled = events.length;
      let completed = 0;
      let completedOnce = false;

      const completeDeal = () => {
        if (completedOnce) return;
        completedOnce = true;

        const completionTimeout = setTimeout(() => onComplete?.(), 0);
        roundStartFallbackTimeoutsRef.current.push(completionTimeout);
      };

      const markAnimationDone = () => {
        completed += 1;
        if (completed >= totalScheduled) {
          completeDeal();
        }
      };

      const scheduleFallbackDone = (delayMs: number, onDone?: () => void) => {
        const timeout = setTimeout(
          () => {
            onDone?.();
            markAnimationDone();
          },
          Math.max(0, delayMs)
        );
        roundStartFallbackTimeoutsRef.current.push(timeout);
      };

      if (totalScheduled === 0) {
        completeDeal();
        return 0;
      }

      roundStartLayoutTimerRef.current = setTimeout(async () => {
        try {
          const animationLayer = animationLayerRef.current;
          if (!animationLayer) {
            setRoundStartAnimatingCardKeys(new Set());
            completeDeal();
            return;
          }

          const { wrapperPos, fromX, fromY } = await measureDeckOrigin(
            gameWrapperRef,
            deckRef,
            layoutMetrics.card
          );

          const myTargetByKey = new Map<string, { toX: number; toY: number }>();
          if (myEvents.length > 0) {
            const handPos = await measureInWindowAsync(handContainerRef);
            const sortedMyHand = sortCardsByRankDesc(myCardsInDealOrder);
            const { offset, startLeft } = calculateLayout(
              handPos.w,
              sortedMyHand.length,
              layoutMetrics.card
            );
            const handRelX = handPos.x - wrapperPos.x;
            const handRelY = handPos.y - wrapperPos.y;

            sortedMyHand.forEach((card, index) => {
              myTargetByKey.set(getCardKey(card), {
                toX: handRelX + startLeft + index * offset,
                toY: handRelY + PLAYER_HAND_SELECTED_LIFT,
              });
            });
          }

          const opponentTargetByPlayerId = new Map<string, { toX: number; toY: number }>();
          await Promise.all(
            playersByDealOrder
              .filter((player) => player.id !== userId)
              .map(async (player) => {
                const view = opponentRefs.current.get(player.id);
                if (!view) return;

                try {
                  const position = await measureInWindowAsync({ current: view });
                  opponentTargetByPlayerId.set(player.id, {
                    toX: position.x - wrapperPos.x + (position.w - layoutMetrics.card.width) / 2,
                    toY: position.y - wrapperPos.y + (position.h - layoutMetrics.card.height) / 2,
                  });
                } catch {
                  // Ignore missing measurements for optional targets.
                }
              })
          );

          for (const event of events) {
            if (event.playerId === userId && event.card) {
              const key = getCardKey(event.card);
              const target = myTargetByKey.get(key);

              if (!target) {
                scheduleFallbackDone(event.delay + DRAW_ANIMATION_DURATION, () => {
                  setRoundStartAnimatingCardKeys((prev) => subtractKeys(prev, [key]));
                });
                continue;
              }

              animationLayer.animateDrawCard({
                card: event.card,
                fromX,
                fromY,
                toX: target.toX,
                toY: target.toY,
                delay: event.delay,
                disabled: playableKeys ? !playableKeys.has(key) : undefined,
                onComplete: () => {
                  setRoundStartAnimatingCardKeys((prev) => subtractKeys(prev, [key]));
                  markAnimationDone();
                },
              });
              continue;
            }

            if (event.playerId === userId) {
              scheduleFallbackDone(event.delay + DRAW_ANIMATION_DURATION);
              continue;
            }

            const opponentTarget = opponentTargetByPlayerId.get(event.playerId);
            if (!opponentTarget) {
              scheduleFallbackDone(event.delay + OPPONENT_DRAW_DURATION, () => {
                onOpponentCardDealt?.(event.playerId);
              });
              continue;
            }

            animationLayer.animateOpponentDraw({
              fromX,
              fromY,
              toX: opponentTarget.toX,
              toY: opponentTarget.toY,
              delay: event.delay,
              onComplete: () => {
                onOpponentCardDealt?.(event.playerId);
                markAnimationDone();
              },
            });
          }
        } catch {
          setRoundStartAnimatingCardKeys(new Set());
          completeDeal();
        }
      }, LAYOUT_SETTLE_DELAY);

      const lastDelay = events.length > 0 ? events[events.length - 1].delay : 0;
      const myDuration = myEvents.length > 0 ? lastDelay + DRAW_ANIMATION_DURATION : 0;
      const opponentDuration =
        events.length > myEvents.length ? lastDelay + OPPONENT_DRAW_DURATION : 0;
      const totalDuration = LAYOUT_SETTLE_DELAY + Math.max(myDuration, opponentDuration);

      roundStartCleanupTimerRef.current = setTimeout(() => {
        setRoundStartAnimatingCardKeys(new Set());
      }, totalDuration + SAFETY_TIMEOUT_BUFFER);

      return totalDuration;
    },
    [
      animationLayerRef,
      clearRoundStartTimers,
      deckRef,
      gameWrapperRef,
      handContainerRef,
      layoutMetrics,
      opponentRefs,
    ]
  );

  const animateOpeningCardToDiscardRef = useCallback(
    (updatedRoom: RoomDetails, userId: string | undefined, onComplete?: () => void) =>
      animateOpeningCardToDiscard({
        updatedRoom,
        userId,
        onComplete,
        animationLayerRef,
        gameWrapperRef,
        discardPileRef,
        discardTopCardOffsetRef,
        handContainerRef,
        opponentRefs,
        layoutMetrics,
      }),
    [
      animationLayerRef,
      discardPileRef,
      discardTopCardOffsetRef,
      gameWrapperRef,
      handContainerRef,
      layoutMetrics,
      opponentRefs,
    ]
  );

  return {
    roundStartAnimatingCardKeys,
    clearRoundStartAnimationState,
    clearRoundStartTimers,
    hidePlayerCardsForRoundStart,
    animateRoundStartDeal,
    animateOpeningCardToDiscard: animateOpeningCardToDiscardRef,
  };
}
