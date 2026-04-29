import type { Card } from '@shedding-game/shared';

import {
  calculateHandScore,
  SCORE_ELIMINATION_THRESHOLD,
  SCORE_RESET_THRESHOLD,
} from '@shedding-game/shared';

import type { Room, RoundScore, RoundScoreEvent } from '@/types';

import { finishRoomIfNoActiveHumans } from '../room';

import { extractDebugHand } from './debug';
import { createDeck, shuffleDeck } from './deck';
import { getScoreMultiplier } from './scoring';

export const setRoomActivity = (room: Room, timestamp: number = Date.now()): number => {
  room.lastActivityAt = timestamp;
  return timestamp;
};

export const startTurn = (
  room: Room,
  nextPlayerIndex: number = room.currentPlayerIndex,
  timestamp: number = Date.now()
): number => {
  room.currentPlayerIndex = nextPlayerIndex;
  room.turnStartedAt = timestamp;
  room.lastActivityAt = timestamp;
  return timestamp;
};

const clearTurnState = (room: Room): void => {
  room.turnStartedAt = undefined;
};

/**
 * Calculate and apply score for a player, returning the round score entry.
 * Handles reset_115 and elimination events.
 */
export const calculateAndApplyPlayerScore = (
  player: { id: string; hand: Card[]; score: number },
  scoreMultiplier: number,
  customEvent?: RoundScoreEvent
): RoundScore => {
  if (player.score >= SCORE_ELIMINATION_THRESHOLD) {
    return {
      playerId: player.id,
      scoreChange: 0,
      totalScore: player.score,
    };
  }

  const baseHandScore = calculateHandScore(player.hand);
  const handScore = baseHandScore * scoreMultiplier;
  player.score += handScore;

  let event: RoundScoreEvent | undefined = customEvent;

  if (player.score === SCORE_RESET_THRESHOLD) {
    player.score = 0;
    event = { type: 'reset_115' };
  } else if (player.score >= SCORE_ELIMINATION_THRESHOLD) {
    event = { type: 'eliminated' };
  }

  return {
    playerId: player.id,
    scoreChange: handScore,
    totalScore: player.score,
    event,
  };
};

/**
 * Finalize round end: push scores to history and update game status.
 */
export const finalizeRoundEnd = (
  room: Room,
  roundScores: RoundScore[],
  winnerIndex: number
): void => {
  if (!room.scoreHistory) {
    room.scoreHistory = [];
  }
  room.scoreHistory.push(roundScores);
  clearTurnState(room);

  if (finishRoomIfNoActiveHumans(room)) {
    return;
  }

  room.gameStatus = 'round_over';
  room.currentPlayerIndex = winnerIndex;
  room.readyForNextRoundPlayerIds = room.players
    .filter((p) => p.isLeaver || p.playerType === 'bot' || p.score >= SCORE_ELIMINATION_THRESHOLD)
    .map((p) => p.id);
};

/**
 * Check if player should be skipped during turn advancement.
 * - Eliminated players (score >= 115) are always skipped
 * - Leavers WITH cards: bot plays for them (not skipped in current round)
 * - Leavers WITHOUT cards: skipped (they don't participate in new rounds)
 */
const isPlayerInactive = (room: Room, playerIndex: number): boolean => {
  const player = room.players[playerIndex];
  if (!player || player.score >= SCORE_ELIMINATION_THRESHOLD) return true;
  // Leavers without cards are skipped (new round started, they don't participate)
  if (player.isLeaver && (!player.hand || player.hand.length === 0)) return true;
  return false;
};

export const getNextActivePlayerIndex = (room: Room): number => {
  let nextIndex = (room.currentPlayerIndex + 1) % room.players.length;
  const start = nextIndex;
  while (isPlayerInactive(room, nextIndex)) {
    nextIndex = (nextIndex + 1) % room.players.length;
    if (nextIndex === start) break;
  }
  return nextIndex;
};

/**
 * Ends the round normally (winner has empty hand, no bridge applied).
 */
export const endRound = (room: Room, winnerIndex: number, lastCards: Card[]): void => {
  const winner = room.players[winnerIndex];
  const roundScores: RoundScore[] = [];
  const scoreMultiplier = getScoreMultiplier(room, false);

  // Rule: Ending with JACK(s) gives -20 per JACK to the winner (multiplied by reshuffles)
  if (lastCards[0].rank === 'J') {
    const jackPenalty = lastCards.length * 20 * scoreMultiplier;
    winner.score -= jackPenalty;
    roundScores.push({
      playerId: winner.id,
      scoreChange: -jackPenalty,
      totalScore: winner.score,
      event: { type: 'jack_bonus' },
    });
  } else {
    roundScores.push({
      playerId: winner.id,
      scoreChange: 0,
      totalScore: winner.score,
    });
  }

  room.players.forEach((p) => {
    if (p.id !== winner.id) {
      roundScores.push(calculateAndApplyPlayerScore(p, scoreMultiplier));
    }
  });

  finalizeRoundEnd(room, roundScores, winnerIndex);
  setRoomActivity(room);
};

export const dealCards = (room: Room, startingPlayerIndex: number = 0) => {
  if (finishRoomIfNoActiveHumans(room)) {
    return;
  }

  const deck = createDeck();
  const hostHand = extractDebugHand(deck, room.debugMode);

  room.deck = shuffleDeck(deck);
  room.discardPile = [];
  room.penaltyCardsCount = 0;
  room.activeSuit = null;
  room.hasDrawnThisTurn = false;
  room.reshuffleCount = 0;
  room.bridgeAvailable = false;
  room.bridgePlayerId = null;
  room.bridgeLastCards = null;
  room.readyForNextRoundPlayerIds = undefined;
  room.isOpeningTurn = false;

  let startIndex = startingPlayerIndex;
  if (startIndex >= room.players.length || isPlayerInactive(room, startIndex)) {
    startIndex = room.players.findIndex(
      (p) => p.score < SCORE_ELIMINATION_THRESHOLD && !p.isLeaver
    );
  }

  if (startIndex === -1) {
    startIndex = 0;
  }

  room.currentPlayerIndex = startIndex;

  room.players.forEach((player, index) => {
    if (player.score < SCORE_ELIMINATION_THRESHOLD && !player.isLeaver) {
      if (index === 0 && hostHand.length > 0) {
        player.hand = hostHand;
      } else {
        player.hand = room.deck.splice(0, 5);
      }
    } else {
      player.hand = [];
    }
  });

  room.gameStatus = 'playing';
  const now = Date.now();
  room.gameStartedAt = room.gameStartedAt ?? now;
  room.turnStartedAt = now;
  room.lastActivityAt = now;

  const startingPlayer = room.players[room.currentPlayerIndex];
  if (startingPlayer && startingPlayer.hand.length > 0) {
    const randomIndex = Math.floor(Math.random() * startingPlayer.hand.length);
    const [openingCard] = startingPlayer.hand.splice(randomIndex, 1);
    room.discardPile.push(openingCard);
    room.isOpeningTurn = true;

    // Apply opening card effects as if the player played it
    if (openingCard.rank === '6') {
      // 6: player must respond per 6 rules (suit/6/J), can't pass
      room.hasDrawnThisTurn = false;
    } else if (openingCard.rank === '7') {
      // 7: penalty set, player can add 7s or pass (penalty goes to next player)
      room.penaltyCardsCount = 2;
      room.hasDrawnThisTurn = true;
    } else if (openingCard.rank === '8') {
      // 8: effect deferred — player may add more 8s before turn ends
      room.hasDrawnThisTurn = true;
    } else {
      // All other cards (9, 10, J, Q, K, A): player can add same rank or pass
      room.hasDrawnThisTurn = true;
    }
  }
};
