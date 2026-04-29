import type { Card } from '@shedding-game/shared';

import { getPlayableMoveGroups } from '@shedding-game/shared';

import type { Room } from '@/types';

import { getNextActivePlayerIndex } from './round';

export const validateBridgeAction = (
  room: Room,
  playerId: string
): { playerIndex: number; player: Room['players'][number] } | null => {
  if (room.gameStatus !== 'playing') return null;
  if (!room.bridgeAvailable) return null;
  if (room.bridgePlayerId !== playerId) return null;

  const playerIndex = room.players.findIndex((player) => player.id === playerId);
  const player = room.players[playerIndex];
  if (!player) return null;

  return { playerIndex, player };
};

export const getCurrentTurnPlayer = (
  room: Room,
  playerId: string
): Room['players'][number] | null => {
  if (room.gameStatus !== 'playing') return null;

  const currentPlayer = room.players[room.currentPlayerIndex];
  if (!currentPlayer || currentPlayer.id !== playerId) return null;

  return currentPlayer;
};

export const countTrailingDiscardRank = (room: Room, rank: Card['rank']): number => {
  let count = 0;

  for (let i = room.discardPile.length - 1; i >= 0; i--) {
    if (room.discardPile[i].rank !== rank) {
      break;
    }

    count++;
  }

  return count;
};

export const advanceCurrentPlayer = (room: Room, steps: number = 1): void => {
  for (let i = 0; i < steps; i++) {
    room.currentPlayerIndex = getNextActivePlayerIndex(room);
  }
};

const hasCardsAvailableToDraw = (room: Room): boolean => {
  return room.deck.length > 0 || room.discardPile.length > 1;
};

const canCurrentPlayerDraw = (room: Room): boolean => {
  if (room.penaltyCardsCount > 0) {
    if (room.isOpeningTurn) {
      return false;
    }

    return hasCardsAvailableToDraw(room);
  }

  const topCard = room.discardPile[room.discardPile.length - 1];
  const isTopSix = topCard?.rank === '6';

  if (room.hasDrawnThisTurn && !isTopSix) {
    return false;
  }

  return hasCardsAvailableToDraw(room);
};

const canCurrentPlayerPass = (room: Room): boolean => {
  const topCard = room.discardPile[room.discardPile.length - 1];

  if (topCard?.rank === '6') {
    return false;
  }

  if (room.isOpeningTurn) {
    return true;
  }

  return room.hasDrawnThisTurn;
};

export const isCurrentPlayerDeadlocked = (room: Room): boolean => {
  if (room.gameStatus !== 'playing' || room.bridgeAvailable) {
    return false;
  }

  const currentPlayer = room.players[room.currentPlayerIndex];
  if (!currentPlayer) {
    return false;
  }

  const playableMoves = getPlayableMoveGroups(currentPlayer.hand, {
    discardPile: room.discardPile,
    activeSuit: room.activeSuit,
    penaltyCardsCount: room.penaltyCardsCount,
    isOpeningTurn: room.isOpeningTurn,
  });

  if (playableMoves.length > 0) {
    return false;
  }

  if (canCurrentPlayerDraw(room)) {
    return false;
  }

  if (canCurrentPlayerPass(room)) {
    return false;
  }

  return true;
};
