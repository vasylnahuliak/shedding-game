import { useCallback, useEffect, useRef, useState } from 'react';

import type { RoomDetails } from '@/types/rooms';
import { getCardKey } from '@/utils/card';

import {
  MAX_VISIBLE_OPPONENT_HAND_CARDS,
  OPENING_FINISH_FALLBACK_BUFFER,
  OPENING_START_FALLBACK_BUFFER,
} from './roundStartAnimation.constants';
import { createInitialOpponentRevealCounts } from './roundStartAnimation.utils';
import { useDeckShuffleAnimation } from './useDeckShuffleAnimation';

type StartDealAnimationFn = (
  room: RoomDetails,
  userId: string | undefined,
  playableKeys?: Set<string>,
  onComplete?: () => void,
  onOpponentCardDealt?: (playerId: string) => void
) => number;

type StartOpeningCardAnimationFn = (
  room: RoomDetails,
  userId: string | undefined,
  onComplete?: () => void
) => number;

type HidePlayerCardsForRoundStartFn = (room: RoomDetails, userId: string | undefined) => void;

type UseRoundStartAnimationParams = {
  userId: string | undefined;
  hidePlayerCardsForRoundStart: HidePlayerCardsForRoundStartFn;
  clearRoundStartAnimationState: () => void;
  animateRoundStartDeal: StartDealAnimationFn;
  animateOpeningCardToDiscard: StartOpeningCardAnimationFn;
};

export function useRoundStartAnimation({
  userId,
  hidePlayerCardsForRoundStart,
  clearRoundStartAnimationState,
  animateRoundStartDeal,
  animateOpeningCardToDiscard,
}: UseRoundStartAnimationParams) {
  const [isRoundStartAnimating, setIsRoundStartAnimating] = useState(false);
  const [revealedHandCardsCountByPlayerId, setRevealedHandCardsCountByPlayerId] = useState<
    Record<string, number>
  >({});
  const [openingDiscardAnimatingKey, setOpeningDiscardAnimatingKey] = useState<string | null>(null);

  // Deck shuffle animation hook
  const { isShuffling, startShuffle, stopShuffle, handleShuffleComplete } =
    useDeckShuffleAnimation();

  const roundStartAnimationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roundStartOpeningAnimationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Token to track and invalidate stale animation sequences (e.g. if a new round starts while previous is animating)
  const animationTokenRef = useRef(0);

  const clearRoundStartAnimationTimeouts = useCallback(() => {
    if (roundStartAnimationTimeoutRef.current) {
      clearTimeout(roundStartAnimationTimeoutRef.current);
      roundStartAnimationTimeoutRef.current = null;
    }
    if (roundStartOpeningAnimationTimeoutRef.current) {
      clearTimeout(roundStartOpeningAnimationTimeoutRef.current);
      roundStartOpeningAnimationTimeoutRef.current = null;
    }
  }, []);

  const stopRoundStartAnimation = useCallback(() => {
    // Increment token to invalidate any awaiting shuffle promises
    animationTokenRef.current += 1;
    clearRoundStartAnimationTimeouts();
    stopShuffle();
    clearRoundStartAnimationState();
    setIsRoundStartAnimating(false);
    setOpeningDiscardAnimatingKey(null);
    setRevealedHandCardsCountByPlayerId({});
  }, [clearRoundStartAnimationState, clearRoundStartAnimationTimeouts, stopShuffle]);

  const startRoundStartAnimation = useCallback(
    async (room: RoomDetails, playableKeys?: Set<string>) => {
      // Start a new animation sequence
      animationTokenRef.current += 1;
      const currentToken = animationTokenRef.current;

      clearRoundStartAnimationTimeouts();
      clearRoundStartAnimationState();

      setIsRoundStartAnimating(true);
      setRevealedHandCardsCountByPlayerId(createInitialOpponentRevealCounts(room, userId));

      const openingCard = room.discardPile[room.discardPile.length - 1];
      setOpeningDiscardAnimatingKey(openingCard ? getCardKey(openingCard) : null);

      // Hide all player cards before shuffle starts
      hidePlayerCardsForRoundStart(room, userId);

      // First, play the deck shuffle animation
      await startShuffle();

      // If the animation was stopped or a new one started while we were shuffling, abort.
      if (currentToken !== animationTokenRef.current) {
        return;
      }

      let openingStarted = false;
      const startOpening = () => {
        if (openingStarted) return;
        openingStarted = true;
        if (roundStartOpeningAnimationTimeoutRef.current) {
          clearTimeout(roundStartOpeningAnimationTimeoutRef.current);
          roundStartOpeningAnimationTimeoutRef.current = null;
        }

        let finished = false;
        const finishOnce = () => {
          if (finished) return;
          finished = true;
          stopRoundStartAnimation();
        };

        const openingDuration = animateOpeningCardToDiscard(room, userId, finishOnce);
        if (openingDuration <= 0) {
          finishOnce();
          return;
        }

        // Fallback in case animation callback doesn't fire.
        roundStartAnimationTimeoutRef.current = setTimeout(
          finishOnce,
          openingDuration + OPENING_FINISH_FALLBACK_BUFFER
        );
      };

      const dealDuration = animateRoundStartDeal(
        room,
        userId,
        playableKeys,
        startOpening,
        (playerId) => {
          setRevealedHandCardsCountByPlayerId((prev) => {
            const current = prev[playerId] ?? 0;
            if (current >= MAX_VISIBLE_OPPONENT_HAND_CARDS) return prev;
            return { ...prev, [playerId]: current + 1 };
          });
        }
      );

      // Fallback in case deal completion callback doesn't fire.
      roundStartOpeningAnimationTimeoutRef.current = setTimeout(
        startOpening,
        Math.max(0, dealDuration) + OPENING_START_FALLBACK_BUFFER
      );
    },
    [
      animateOpeningCardToDiscard,
      animateRoundStartDeal,
      clearRoundStartAnimationState,
      clearRoundStartAnimationTimeouts,
      hidePlayerCardsForRoundStart,
      startShuffle,
      stopRoundStartAnimation,
      userId,
    ]
  );

  useEffect(
    function cleanupRoundStartAnimationOnUnmount() {
      return () => clearRoundStartAnimationTimeouts();
    },
    [clearRoundStartAnimationTimeouts]
  );

  /** Start only the shuffle animation (for mid-game reshuffle) */
  const startReshuffleAnimation = useCallback(async () => {
    await startShuffle();
  }, [startShuffle]);

  return {
    isRoundStartAnimating,
    isShuffling,
    handleShuffleComplete,
    openingDiscardAnimatingKey,
    revealedHandCardsCountByPlayerId,
    startRoundStartAnimation,
    startReshuffleAnimation,
    stopRoundStartAnimation,
  };
}
