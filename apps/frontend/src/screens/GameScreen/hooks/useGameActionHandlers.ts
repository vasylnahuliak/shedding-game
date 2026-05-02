import type { RefObject } from 'react';

import type { Card as CardType } from '@shedding-game/shared';
import { useRouter } from 'expo-router';

import { wouldCreateBridge } from '@shedding-game/shared';

import type { SuitPickerMode } from '@/hooks/useGameUiStore';
import { HTTPError } from '@/services';
import { playActionHaptic, playSelectionHaptic } from '@/services/haptics';
import { LoggingService } from '@/services/LoggingService';
import { RoomsService } from '@/services/RoomsService';
import { SocketService } from '@/services/SocketService';
import type { RoomDetails } from '@/types/rooms';

type UseGameActionHandlersParams = {
  roomId: string | undefined;
  room: RoomDetails | null;
  selectedCards: CardType[];
  discardPile: CardType[];
  topDiscard: CardType | null;
  myHandSize: number;
  isHost: boolean;
  isRoundStartAnimating: boolean;
  isTopSix: boolean;
  pendingBridgeJack: boolean;
  canApplyBridge: boolean;
  suitPickerMode: SuitPickerMode | null;
  clearSelectedCards: () => void;
  setSuitPickerMode: (mode: SuitPickerMode | null) => void;
  setPendingBridgeJack: (isPending: boolean) => void;
  setDrawButtonDisabled: (isDisabled: boolean) => void;
  clearDrawButtonTimeout: () => void;
  drawButtonTimeoutRef: RefObject<ReturnType<typeof setTimeout> | null>;
  suppressBridge: boolean;
  setSuppressBridge: (value: boolean) => void;
};

export function useGameActionHandlers({
  roomId,
  room,
  selectedCards,
  discardPile,
  topDiscard,
  myHandSize,
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
}: UseGameActionHandlersParams) {
  const router = useRouter();

  const handlePlay = () => {
    if (isRoundStartAnimating || selectedCards.length === 0 || !room || !roomId) {
      return;
    }

    const isLastCards = myHandSize === selectedCards.length;

    if (selectedCards[0].rank === 'J' && !isLastCards) {
      if (wouldCreateBridge(selectedCards, discardPile)) {
        setPendingBridgeJack(true);
        return;
      }

      setSuitPickerMode('play');
      return;
    }

    playActionHaptic();
    SocketService.emit('make_move', {
      roomId,
      cards: selectedCards,
      chosenSuit: selectedCards[0].rank === 'J' ? selectedCards[0].suit : undefined,
    });
    clearSelectedCards();
  };

  const handleSuitSelect = (suit: CardType['suit']) => {
    if (!roomId) {
      setSuitPickerMode(null);
      return;
    }

    if (suitPickerMode === 'opening_pass') {
      playSelectionHaptic();
      SocketService.emit('pass_turn', { roomId, chosenSuit: suit });
    } else {
      playSelectionHaptic();
      SocketService.emit('make_move', { roomId, cards: selectedCards, chosenSuit: suit });

      if (suppressBridge) {
        SocketService.emit('decline_bridge', { roomId });
      }

      clearSelectedCards();
    }

    setSuitPickerMode(null);
  };

  const handleDraw = () => {
    if (isRoundStartAnimating || !room || !roomId) {
      return;
    }

    if (room.hasDrawnThisTurn && !isTopSix) {
      if (room.isOpeningTurn && topDiscard?.rank === 'J') {
        setSuitPickerMode('opening_pass');
        return;
      }

      playActionHaptic();
      SocketService.emit('pass_turn', { roomId });
      return;
    }

    playActionHaptic();
    SocketService.emit('draw_card', { roomId });
    setDrawButtonDisabled(true);
    clearDrawButtonTimeout();
    drawButtonTimeoutRef.current = setTimeout(() => {
      drawButtonTimeoutRef.current = null;
      setDrawButtonDisabled(false);
    }, 500);
  };

  const handleReadyNextRound = () => {
    if (!roomId) return;
    SocketService.emit('player_ready_next_round', { roomId });
  };

  const handleLeaveRoom = async () => {
    if (!roomId) {
      router.replace('/');
      return;
    }

    if (isHost) {
      SocketService.emit('delete_room', { roomId });
      router.replace('/');
      return;
    }

    try {
      SocketService.emit('leave_room', { roomId });
      await RoomsService.leaveRoom(roomId);
    } catch (error) {
      if (!(error instanceof HTTPError && [404, 410].includes(error.response.status))) {
        LoggingService.error('Failed to leave room from game over modal', error, { roomId });
      }
    } finally {
      router.replace('/');
    }
  };

  const handlePlayAgain = () => {
    if (!roomId) return;
    SocketService.emit('recreate_room', { roomId });
  };

  const handleApplyBridge = () => {
    if (!roomId) return;
    playActionHaptic();
    SocketService.emit('apply_bridge', { roomId });
  };

  const handleDeclineBridge = () => {
    if (!roomId) return;
    playSelectionHaptic();
    SocketService.emit('decline_bridge', { roomId });
  };

  const handlePendingBridgeApply = () => {
    if (selectedCards.length === 0 || !roomId) {
      setPendingBridgeJack(false);
      return;
    }

    playActionHaptic();
    SocketService.emit('make_move', {
      roomId,
      cards: selectedCards,
      chosenSuit: selectedCards[0].suit,
      applyBridgeAfterMove: true,
    });
    setPendingBridgeJack(false);
    clearSelectedCards();
  };

  const handlePendingBridgeDecline = () => {
    if (selectedCards.length === 0) {
      setPendingBridgeJack(false);
      return;
    }

    playSelectionHaptic();
    setPendingBridgeJack(false);
    setSuppressBridge(true);
    setSuitPickerMode('play');
  };

  const handleBridgeApply = pendingBridgeJack ? handlePendingBridgeApply : handleApplyBridge;
  const handleBridgeDecline = pendingBridgeJack ? handlePendingBridgeDecline : handleDeclineBridge;

  return {
    handlePlay,
    handleSuitSelect,
    handleDraw,
    handleReadyNextRound,
    handleLeaveRoom,
    handlePlayAgain,
    handleBridgeApply,
    handleBridgeDecline,
    isBridgeModalVisible: pendingBridgeJack || (canApplyBridge && !suppressBridge),
    bridgeScoreMultiplier: (room?.reshuffleCount || 0) + 2,
  };
}
