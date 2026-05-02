import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler } from 'react-native';

import type { Card as CardType } from '@shedding-game/shared';
import { useGlobalSearchParams, usePathname } from 'expo-router';

import { SCORE_ELIMINATION_THRESHOLD } from '@shedding-game/shared';

import { useGameScreenStore, useGameUiStore } from '@/hooks';
import { useAuth } from '@/hooks/useAuthStore';
import { getGameModalRouteName, isForcedGameModalRouteName } from '@/navigation/appRoutes';

import { gameLayoutMetrics } from '../gameLayout';

import {
  EMPTY_CARDS,
  getPlayerAtIndex,
  getPlayerIndex,
  getSelectableCards,
  getWinner,
  sortCardsByRankDesc,
} from './gameSelectors';
import { useCardAnimations } from './useCardAnimations';
import { useGameActionHandlers } from './useGameActionHandlers';
import { useGameRoomSync } from './useGameRoomSync';
import { useRoundStartAnimation } from './useRoundStartAnimation';

const getSingleSearchParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export const useGameScreenController = () => {
  const { roomId: roomIdParam } = useGlobalSearchParams<{ roomId?: string | string[] }>();
  const pathname = usePathname();
  const user = useAuth((state) => state.user);
  const userId = user?.id;
  const isAuthLoading = useAuth((state) => state.isLoading);
  const room = useGameScreenStore((state) => state.room);
  const roomId = getSingleSearchParam(roomIdParam) ?? room?.id ?? '';
  const selectedCards = useGameScreenStore((state) => state.selectedCards);
  const setRoom = useGameScreenStore((state) => state.setRoom);
  const setSelectedCards = useGameScreenStore((state) => state.setSelectedCards);
  const clearSelectedCards = useGameScreenStore((state) => state.clearSelectedCards);
  const resetGameScreenStore = useGameScreenStore((state) => state.reset);
  const suitPickerMode = useGameUiStore((state) => state.suitPickerMode);
  const pendingBridgeJack = useGameUiStore((state) => state.pendingBridgeJack);
  const setSuitPickerMode = useGameUiStore((state) => state.setSuitPickerMode);
  const setPendingBridgeJack = useGameUiStore((state) => state.setPendingBridgeJack);
  const setDrawButtonDisabled = useGameUiStore((state) => state.setDrawButtonDisabled);
  const resetGameUiStore = useGameUiStore((state) => state.reset);
  const [suppressBridge, setSuppressBridge] = useState(false);
  const drawButtonTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentGameModalRouteName = getGameModalRouteName(pathname);
  const layoutMetrics = gameLayoutMetrics;
  const shouldBlockHardwareBack =
    pathname === '/game' || isForcedGameModalRouteName(currentGameModalRouteName);

  const clearDrawButtonTimeout = useCallback(() => {
    if (drawButtonTimeoutRef.current) {
      clearTimeout(drawButtonTimeoutRef.current);
      drawButtonTimeoutRef.current = null;
    }
  }, []);

  const {
    animatingCardKeys,
    animatingPlayCardKeys,
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
  } = useCardAnimations(layoutMetrics);

  const {
    isRoundStartAnimating,
    isShuffling,
    handleShuffleComplete,
    openingDiscardAnimatingKey,
    revealedHandCardsCountByPlayerId,
    startRoundStartAnimation,
    startReshuffleAnimation,
    stopRoundStartAnimation,
  } = useRoundStartAnimation({
    userId,
    hidePlayerCardsForRoundStart,
    clearRoundStartAnimationState,
    animateRoundStartDeal,
    animateOpeningCardToDiscard,
  });

  const resetBridgeSuppression = useCallback(() => {
    setSuppressBridge(false);
  }, []);

  useGameRoomSync({
    roomId,
    room,
    isAuthLoading,
    userId,
    setRoom,
    clearSelectedCards,
    setPendingBridgeJack,
    resetBridgeSuppression,
    startRoundStartAnimation,
    startReshuffleAnimation,
    stopRoundStartAnimation,
    resetCardAnimations,
    handleRoomUpdateForAnimation,
  });

  useEffect(
    function blockHardwareBackInGame() {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => shouldBlockHardwareBack);
      return () => sub.remove();
    },
    [shouldBlockHardwareBack]
  );

  useEffect(
    function resetGameScreenControllerOnUnmount() {
      return () => {
        clearDrawButtonTimeout();
        resetGameScreenStore();
        resetGameUiStore();
      };
    },
    [clearDrawButtonTimeout, resetGameScreenStore, resetGameUiStore]
  );

  const myPlayerIndex = getPlayerIndex(room, userId);

  const myPlayer = getPlayerAtIndex(room, myPlayerIndex);

  const isMyTurn = !!room && myPlayerIndex >= 0 && room.currentPlayerIndex === myPlayerIndex;
  const isMyTurnEnabled = isMyTurn && !isRoundStartAnimating;

  const winner = getWinner(room);

  const isHost = !!room && room.hostId === userId;
  const isEliminated = (myPlayer?.score || 0) >= SCORE_ELIMINATION_THRESHOLD;

  const myHand = Array.isArray(myPlayer?.hand) ? sortCardsByRankDesc(myPlayer.hand) : EMPTY_CARDS;

  const discardPile = room?.discardPile ?? EMPTY_CARDS;
  const topDiscard = discardPile.length > 0 ? discardPile[discardPile.length - 1] : null;
  const isTopSix = topDiscard?.rank === '6';
  const canApplyBridge = !!(room?.bridgeAvailable && room.bridgePlayerId === userId);

  const playableCards = room
    ? getSelectableCards(
        myHand,
        discardPile,
        room.activeSuit,
        room.penaltyCardsCount,
        selectedCards,
        room.isOpeningTurn
      )
    : EMPTY_CARDS;

  const visibleAnimatingPlayCardKeys = openingDiscardAnimatingKey
    ? new Set([...animatingPlayCardKeys, openingDiscardAnimatingKey])
    : animatingPlayCardKeys;

  const toggleCardSelection = useCallback(
    (card: CardType) => {
      if (
        selectedCards.some(
          (selectedCard) => selectedCard.rank === card.rank && selectedCard.suit === card.suit
        )
      ) {
        setSelectedCards(
          selectedCards.filter(
            (selectedCard) => selectedCard.rank !== card.rank || selectedCard.suit !== card.suit
          )
        );
        return;
      }

      setSelectedCards([...selectedCards, card]);
    },
    [selectedCards, setSelectedCards]
  );

  const {
    handlePlay,
    handleSuitSelect,
    handleDraw,
    handleReadyNextRound,
    handleLeaveRoom,
    handlePlayAgain,
    handleBridgeApply,
    handleBridgeDecline,
    isBridgeModalVisible,
    bridgeScoreMultiplier,
  } = useGameActionHandlers({
    roomId,
    room,
    selectedCards,
    discardPile,
    topDiscard,
    myHandSize: myHand.length,
    isHost,
    isRoundStartAnimating,
    isTopSix,
    pendingBridgeJack,
    canApplyBridge,
    suitPickerMode,
    clearSelectedCards,
    setSuitPickerMode,
    setPendingBridgeJack,
    setDrawButtonDisabled,
    clearDrawButtonTimeout,
    drawButtonTimeoutRef,
    suppressBridge,
    setSuppressBridge,
  });

  return {
    layoutMetrics,
    roomId,
    room,
    winner,
    isHost,
    isEliminated,
    myPlayer,
    myHand,
    playableCards,
    isMyTurnEnabled,
    isRoundStartAnimating,
    isShuffling,
    revealedHandCardsCountByPlayerId,
    pendingOpponentDrawCountByPlayerId,
    animatingCardKeys,
    visibleAnimatingPlayCardKeys,
    animationLayerRef,
    gameWrapperRef,
    deckRef,
    handContainerRef,
    discardPileRef,
    discardTopCardOffsetRef,
    registerOpponentRef,
    handleShuffleComplete,
    handleSuitSelect,
    handleReadyNextRound,
    handleLeaveRoom,
    handlePlayAgain,
    suitPickerMode,
    isBridgeModalVisible,
    bridgeScoreMultiplier,
    handleBridgeApply,
    handleBridgeDecline,
    handlePlay,
    handleDraw,
    toggleCardSelection,
  };
};
