import type { Card, Suit } from '@shedding-game/shared';

import { isBridgeAvailable } from '@shedding-game/shared';

import type { Room, RoundScore } from '@/types';

import { drawCardsFromDeck, reshuffleDeck } from './deck';
import {
  advanceCurrentPlayer,
  countTrailingDiscardRank,
  getCurrentTurnPlayer,
  isCurrentPlayerDeadlocked,
  validateBridgeAction,
} from './movesHelpers';
import {
  calculateAndApplyPlayerScore,
  endRound,
  finalizeRoundEnd,
  getNextActivePlayerIndex,
  setRoomActivity,
  startTurn,
} from './round';
import { getScoreMultiplier } from './scoring';
import type { GameMoveError } from './validation';
import { validateMoveWithReason } from './validation';

/**
 * Makes a move and returns a structured error if invalid, or null if successful.
 */
export const makeMoveWithError = (
  room: Room,
  playerId: string,
  cards: Card[],
  chosenSuit?: Suit
): GameMoveError | null => {
  const error = validateMoveWithReason(room, playerId, cards, chosenSuit);
  if (error) {
    return error;
  }

  const now = setRoomActivity(room);
  const playerIndex = room.players.findIndex((p) => p.id === playerId);
  const player = room.players[playerIndex];
  if (!player) return { code: 'GAME_PLAYER_NOT_FOUND' };

  cards.forEach((card) => {
    const index = player.hand.findIndex((h) => h.rank === card.rank && h.suit === card.suit);
    if (index !== -1) {
      player.hand.splice(index, 1);
    }
  });

  room.discardPile.push(...cards);

  if (cards[0].rank === 'J' && chosenSuit) {
    room.activeSuit = chosenSuit;
  } else {
    room.activeSuit = null;
  }

  if (cards[0].rank === '7') {
    room.penaltyCardsCount += 2 * cards.length;
  } else {
    room.penaltyCardsCount = 0;
  }

  if (cards.length > 0 && cards[0].rank === '8') {
    const nextPlayerIndex = getNextActivePlayerIndex(room);
    const nextPlayer = room.players[nextPlayerIndex];
    // During opening turn, the opening 8 also counts toward the draw total
    const cardsToDraw = room.isOpeningTurn ? cards.length + 1 : cards.length;
    drawCardsFromDeck(room, nextPlayer, cardsToDraw);
  }

  if (player.hand.length === 0 && room.penaltyCardsCount > 0) {
    const nextPlayerIndex = getNextActivePlayerIndex(room);
    const nextPlayer = room.players[nextPlayerIndex];

    if (nextPlayer.id !== player.id) {
      const count = room.penaltyCardsCount;
      drawCardsFromDeck(room, nextPlayer, count);
      room.penaltyCardsCount = 0;
    }
  }

  const wasOpeningTurn = room.isOpeningTurn;
  room.hasDrawnThisTurn = false;
  room.isOpeningTurn = false;

  room.bridgeAvailable = isBridgeAvailable(room.discardPile);
  room.bridgePlayerId = room.bridgeAvailable ? playerId : null;
  room.bridgeLastCards = room.bridgeAvailable ? cards : null;
  if (room.bridgeAvailable) {
    room.turnStartedAt = now;
  }

  if (player.hand.length === 0) {
    if (room.bridgeAvailable) {
      return null;
    }

    endRound(room, playerIndex, cards);
  } else {
    let steps = 1;
    if (cards[0].rank === '6') {
      steps = 0;
    } else if (cards[0].rank === 'A') {
      if (wasOpeningTurn) {
        // Count all consecutive As from the top (including the opening A)
        steps += countTrailingDiscardRank(room, 'A');
      } else {
        steps += cards.length;
      }
    }

    advanceCurrentPlayer(room, steps);

    startTurn(room, room.currentPlayerIndex, now);
  }

  return null;
};

export const makeMove = (
  room: Room,
  playerId: string,
  cards: Card[],
  chosenSuit?: Suit
): boolean => {
  return makeMoveWithError(room, playerId, cards, chosenSuit) === null;
};

export const drawCard = (room: Room, playerId: string): boolean => {
  const currentPlayer = getCurrentTurnPlayer(room, playerId);
  if (!currentPlayer) return false;

  if (room.penaltyCardsCount > 0) {
    // During opening turn, the penalty belongs to the next player, not the opener
    if (room.isOpeningTurn) return false;

    const count = room.penaltyCardsCount;
    const drawn = drawCardsFromDeck(room, currentPlayer, count);
    room.penaltyCardsCount = 0;
    advanceCurrentPlayer(room);
    room.hasDrawnThisTurn = false;
    if (drawn > 0) {
      startTurn(room, room.currentPlayerIndex);
    }
    return drawn > 0;
  }

  if (room.deck.length === 0) {
    if (!reshuffleDeck(room)) {
      return false;
    }
  }

  const topCard = room.discardPile[room.discardPile.length - 1];
  const isTopSix = topCard && topCard.rank === '6';

  if (room.hasDrawnThisTurn && !isTopSix) {
    return false;
  }

  const drawn = drawCardsFromDeck(room, currentPlayer, 1);
  if (drawn > 0) {
    room.hasDrawnThisTurn = true;
    room.isOpeningTurn = false;
    setRoomActivity(room);
    return true;
  }
  return false;
};

export const passTurn = (room: Room, playerId: string, chosenSuit?: Suit): boolean => {
  if (!getCurrentTurnPlayer(room, playerId)) return false;

  const topCard = room.discardPile[room.discardPile.length - 1];

  if (topCard && topCard.rank === '6') {
    return false;
  }

  if (room.isOpeningTurn) {
    if (topCard && topCard.rank === 'J') {
      if (!chosenSuit) return false;
      room.activeSuit = chosenSuit;
    }

    // 8: opening card effect — next player draws 1 card
    if (topCard && topCard.rank === '8') {
      const nextIdx = getNextActivePlayerIndex(room);
      const nextPlayer = room.players[nextIdx];
      drawCardsFromDeck(room, nextPlayer, 1);
    }

    let steps = 1;
    if (topCard && topCard.rank === 'A') {
      steps += countTrailingDiscardRank(room, 'A');
    }

    advanceCurrentPlayer(room, steps);

    room.isOpeningTurn = false;
    room.hasDrawnThisTurn = false;
    startTurn(room, room.currentPlayerIndex);
    return true;
  }

  if (!room.hasDrawnThisTurn) return false;

  advanceCurrentPlayer(room);
  room.hasDrawnThisTurn = false;
  startTurn(room, room.currentPlayerIndex);
  return true;
};

/**
 * Force advance turn when player is stuck: no playable cards + can't draw (deck empty).
 */
export const forceAdvanceTurnWhenStuck = (room: Room, playerId: string): boolean => {
  if (!getCurrentTurnPlayer(room, playerId)) return false;

  advanceCurrentPlayer(room);
  room.hasDrawnThisTurn = false;
  room.isOpeningTurn = false;
  startTurn(room, room.currentPlayerIndex);
  return true;
};

/**
 * Resolve deadlocks by automatically skipping consecutive stuck players until the game can continue.
 */
export const resolveDeadlockIfNeeded = (room: Room): boolean => {
  if (!isCurrentPlayerDeadlocked(room)) {
    return false;
  }

  let deadlockResolved = false;
  const visitedPlayerIds = new Set<string>();

  while (room.gameStatus === 'playing' && !room.bridgeAvailable) {
    const currentPlayer = room.players[room.currentPlayerIndex];
    if (!currentPlayer || visitedPlayerIds.has(currentPlayer.id)) {
      break;
    }

    if (!isCurrentPlayerDeadlocked(room)) {
      break;
    }

    visitedPlayerIds.add(currentPlayer.id);

    if (!forceAdvanceTurnWhenStuck(room, currentPlayer.id)) {
      break;
    }

    deadlockResolved = true;
  }

  return deadlockResolved;
};

/**
 * Decline bridge - clears bridge state and continues game or ends round.
 */
export const declineBridge = (room: Room, playerId: string): boolean => {
  const validated = validateBridgeAction(room, playerId);
  if (!validated) return false;

  const { playerIndex, player } = validated;
  const lastCards = room.bridgeLastCards;

  room.bridgeAvailable = false;
  room.bridgePlayerId = null;
  room.bridgeLastCards = null;

  if (player.hand.length === 0 && lastCards) {
    endRound(room, playerIndex, lastCards);
  } else {
    startTurn(room, room.currentPlayerIndex);
  }
  return true;
};

/**
 * Apply bridge - ends the round with increased multiplier.
 */
export const applyBridge = (room: Room, playerId: string): boolean => {
  const validated = validateBridgeAction(room, playerId);
  if (!validated) return false;

  const { playerIndex } = validated;

  const roundScores: RoundScore[] = [];
  const scoreMultiplier = getScoreMultiplier(room, true);

  room.players.forEach((p) => {
    const customEvent = p.id === playerId ? { type: 'bridge' as const } : undefined;
    roundScores.push(calculateAndApplyPlayerScore(p, scoreMultiplier, customEvent));
  });

  room.bridgeAvailable = false;
  room.bridgePlayerId = null;
  room.bridgeLastCards = null;

  finalizeRoundEnd(room, roundScores, playerIndex);
  setRoomActivity(room);
  return true;
};
