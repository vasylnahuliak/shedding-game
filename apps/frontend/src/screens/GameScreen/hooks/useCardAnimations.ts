import { useCallback, useEffect, useRef } from 'react';
import type { View } from 'react-native';

import type { RoomDetails } from '@/types/rooms';

import type { CardAnimationHandle } from '../CardAnimationLayer';
import type { GameLayoutMetrics } from '../gameLayout';

import {
  detectOpponentDraws,
  detectOpponentPlayedCards,
  detectPlayerDrawnCards,
  detectPlayerPlayedCards,
} from './animationDetection';
import type { QueueBatch } from './cardAnimationRefs';
import { useQueuedDrawAnimations } from './useQueuedDrawAnimations';
import { useQueuedPlayAnimations } from './useQueuedPlayAnimations';
import { useRoundStartCardAnimations } from './useRoundStartCardAnimations';

export function useCardAnimations(layoutMetrics: GameLayoutMetrics) {
  const animationLayerRef = useRef<CardAnimationHandle>(null);
  const gameWrapperRef = useRef<View>(null);
  const deckRef = useRef<View>(null);
  const handContainerRef = useRef<View>(null);
  const discardPileRef = useRef<View>(null);
  const discardTopCardOffsetRef = useRef(0);
  const opponentRefs = useRef(new Map<string, View>());

  const isMountedRef = useRef(true);
  const drawQueueRef = useRef(Promise.resolve());
  const playQueueRef = useRef(Promise.resolve());
  const generationRef = useRef(0);

  const isGenerationActive = useCallback(
    (generation: number) => isMountedRef.current && generation === generationRef.current,
    []
  );

  const queueBatch = useCallback<QueueBatch>(
    (queue, run) => {
      const scheduledGeneration = generationRef.current;
      queue.current = queue.current
        .catch(() => undefined)
        .then(async () => {
          if (!isGenerationActive(scheduledGeneration)) return;
          await run(scheduledGeneration);
        });
    },
    [isGenerationActive]
  );

  const {
    playerDrawAnimatingKeys,
    pendingOpponentDrawCountByPlayerId,
    resetDrawAnimations,
    schedulePlayerDraw,
    scheduleOpponentDraw,
  } = useQueuedDrawAnimations({
    animationLayerRef,
    gameWrapperRef,
    deckRef,
    handContainerRef,
    opponentRefs,
    drawQueueRef,
    layoutMetrics,
    isGenerationActive,
    queueBatch,
  });

  const { playAnimatingKeys, resetPlayAnimations, schedulePlayerPlay, scheduleOpponentPlay } =
    useQueuedPlayAnimations({
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
    });

  const {
    roundStartAnimatingCardKeys,
    clearRoundStartAnimationState,
    clearRoundStartTimers,
    hidePlayerCardsForRoundStart,
    animateRoundStartDeal,
    animateOpeningCardToDiscard,
  } = useRoundStartCardAnimations({
    animationLayerRef,
    gameWrapperRef,
    deckRef,
    handContainerRef,
    discardPileRef,
    discardTopCardOffsetRef,
    opponentRefs,
    layoutMetrics,
  });

  const registerOpponentRef = useCallback((playerId: string, ref: View | null) => {
    if (ref) opponentRefs.current.set(playerId, ref);
    else opponentRefs.current.delete(playerId);
  }, []);

  const resetCardAnimations = useCallback(() => {
    generationRef.current += 1;
    drawQueueRef.current = Promise.resolve();
    playQueueRef.current = Promise.resolve();
    clearRoundStartTimers();
    animationLayerRef.current?.clearAll();

    resetDrawAnimations();
    resetPlayAnimations();
    clearRoundStartAnimationState();
  }, [
    clearRoundStartAnimationState,
    clearRoundStartTimers,
    resetDrawAnimations,
    resetPlayAnimations,
  ]);

  useEffect(
    function resetCardAnimationsOnUnmount() {
      return () => {
        isMountedRef.current = false;
        generationRef.current += 1;
        drawQueueRef.current = Promise.resolve();
        playQueueRef.current = Promise.resolve();
        clearRoundStartTimers();
      };
    },
    [clearRoundStartTimers]
  );

  const handleRoomUpdateForAnimation = useCallback(
    (
      prevRoom: RoomDetails | null,
      updatedRoom: RoomDetails,
      userId: string | undefined,
      playableKeys?: Set<string>,
      options: { delay?: number } = {}
    ) => {
      if (!prevRoom) return;

      const { drawnCards, sortedNewHand } = detectPlayerDrawnCards(prevRoom, updatedRoom, userId);
      if (drawnCards.length > 0) {
        schedulePlayerDraw(drawnCards, sortedNewHand, playableKeys, {
          startDelay: options.delay,
        });
      }

      const opponentDraws = detectOpponentDraws(prevRoom, updatedRoom, userId);
      if (opponentDraws.length > 0) {
        scheduleOpponentDraw(opponentDraws, { startDelay: options.delay });
      }

      const { playedCards, sortedPrevHand } = detectPlayerPlayedCards(
        prevRoom,
        updatedRoom,
        userId
      );
      if (playedCards.length > 0) {
        schedulePlayerPlay(playedCards, sortedPrevHand);
      }

      const opponentPlays = detectOpponentPlayedCards(prevRoom, updatedRoom, userId);
      if (opponentPlays.length > 0) {
        scheduleOpponentPlay(opponentPlays);
      }
    },
    [scheduleOpponentDraw, scheduleOpponentPlay, schedulePlayerDraw, schedulePlayerPlay]
  );

  const animatingCardKeys =
    playerDrawAnimatingKeys.size === 0 && roundStartAnimatingCardKeys.size === 0
      ? playerDrawAnimatingKeys
      : new Set([...playerDrawAnimatingKeys, ...roundStartAnimatingCardKeys]);

  return {
    animatingCardKeys,
    animatingPlayCardKeys: playAnimatingKeys,
    pendingOpponentDrawCountByPlayerId,
    animationLayerRef,
    gameWrapperRef,
    deckRef,
    handContainerRef,
    discardPileRef,
    discardTopCardOffsetRef,
    registerOpponentRef,
    hidePlayerCardsForRoundStart,
    clearRoundStartAnimationState,
    resetCardAnimations,
    animateRoundStartDeal,
    animateOpeningCardToDiscard,
    handleRoomUpdateForAnimation,
  };
}
