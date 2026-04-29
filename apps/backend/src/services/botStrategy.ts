import type { Card, Suit } from '@shedding-game/shared';

import {
  calculateHandScore,
  getPlayableMoveGroups,
  SCORE_ELIMINATION_THRESHOLD,
} from '@shedding-game/shared';

import type { Player, Room } from '@/types';

const BOT_PLAY_ALL_SEVENS_CHANCE = 0.2;

export const chooseBestSuit = (hand: Card[]): Suit => {
  const suitCounts = new Map<Suit, number>();
  hand.forEach((card) => {
    if (card.rank !== 'J') {
      suitCounts.set(card.suit, (suitCounts.get(card.suit) || 0) + 1);
    }
  });

  let bestSuit: Suit = 'hearts';
  let maxCount = 0;
  suitCounts.forEach((count, suit) => {
    if (count > maxCount) {
      maxCount = count;
      bestSuit = suit;
    }
  });

  return bestSuit;
};

const isBot = (room: Room, playerId: string): boolean => {
  const player = room.players.find((candidate) => candidate.id === playerId);
  return player?.playerType === 'bot';
};

export const shouldBotControl = (room: Room, playerId: string): boolean => {
  if (isBot(room, playerId)) {
    return true;
  }

  const player = room.players.find((candidate) => candidate.id === playerId);
  return player?.isLeaver === true && player.hand && player.hand.length > 0;
};

export const getPlayableCards = (room: Room, playerId: string): Card[][] => {
  const player = room.players.find((candidate) => candidate.id === playerId);
  if (!player) {
    return [];
  }

  return getPlayableMoveGroups(player.hand, {
    discardPile: room.discardPile,
    activeSuit: room.activeSuit,
    penaltyCardsCount: room.penaltyCardsCount,
    isOpeningTurn: room.isOpeningTurn,
  });
};

const getCardPriority = (card: Card): number => {
  switch (card.rank) {
    case 'J':
      return 100;
    case 'A':
      return 90;
    case '10':
    case 'Q':
    case 'K':
      return 80;
    case '7':
      return 70;
    case '8':
      return 60;
    case '6':
      return 10;
    case '9':
      return 20;
    default:
      return 50;
  }
};

export const chooseBestMove = (
  room: Room,
  playerId: string,
  moves: Card[][]
): { cards: Card[]; chosenSuit?: Suit } | null => {
  if (moves.length === 0) {
    return null;
  }

  const player = room.players.find((candidate) => candidate.id === playerId);
  if (!player) {
    return null;
  }

  const sevenCardsCount = player.hand.filter((card) => card.rank === '7').length;
  if (sevenCardsCount > 1) {
    const sevenMoves = moves.filter((candidate) => candidate[0].rank === '7');
    if (sevenMoves.length > 0) {
      const allSevensMove = sevenMoves.reduce(
        (best, candidate) => (candidate.length > best.length ? candidate : best),
        sevenMoves[0]
      );
      const singleSevenMove =
        sevenMoves.find((candidate) => candidate.length === 1) ?? sevenMoves[0];

      if (allSevensMove.length > 1 && Math.random() < BOT_PLAY_ALL_SEVENS_CHANCE) {
        return { cards: allSevensMove };
      }

      return { cards: singleSevenMove };
    }
  }

  const orderedMoves = [...moves].sort((left, right) => {
    const priorityLeft = left.reduce((sum, card) => sum + getCardPriority(card), 0) / left.length;
    const priorityRight =
      right.reduce((sum, card) => sum + getCardPriority(card), 0) / right.length;
    const countBonusLeft = left.length * 5;
    const countBonusRight = right.length * 5;

    return priorityRight + countBonusRight - (priorityLeft + countBonusLeft);
  });

  const bestMove = orderedMoves[0];
  if (bestMove[0].rank === 'J') {
    return { cards: bestMove, chosenSuit: chooseBestSuit(player.hand) };
  }

  return { cards: bestMove };
};

const getHandAfterMove = (hand: Card[], cardsToPlay: Card[]): Card[] => {
  const remaining = [...hand];
  cardsToPlay.forEach((card) => {
    const index = remaining.findIndex(
      (candidate) => candidate.rank === card.rank && candidate.suit === card.suit
    );
    if (index !== -1) {
      remaining.splice(index, 1);
    }
  });

  return remaining;
};

const isRiskySixMove = (hand: Card[], cardsToPlay: Card[]): boolean => {
  if (cardsToPlay.length === 0 || cardsToPlay[0].rank !== '6') {
    return false;
  }

  const nextTopSuit = cardsToPlay[cardsToPlay.length - 1].suit;
  const handAfterMove = getHandAfterMove(hand, cardsToPlay);

  const hasFollowUpForSix = handAfterMove.some(
    (card) => card.rank === '6' || card.rank === 'J' || card.suit === nextTopSuit
  );

  return !hasFollowUpForSix;
};

export const shouldAvoidRiskySixMove = (
  room: Room,
  hand: Card[],
  validMoves: Card[][],
  move: { cards: Card[]; chosenSuit?: Suit }
): boolean => {
  if (move.cards[0].rank !== '6') return false;
  if (room.penaltyCardsCount > 0 || room.isOpeningTurn) return false;

  const topCard = room.discardPile[room.discardPile.length - 1];
  if (!topCard || topCard.rank === '6') return false;

  const hasNonSixAlternative = validMoves.some((candidate) => candidate[0].rank !== '6');
  if (hasNonSixAlternative) return false;

  return isRiskySixMove(hand, move.cards);
};

export const shouldApplyBridge = (room: Room, botId: string): boolean => {
  const bot = room.players.find((player) => player.id === botId);
  if (!bot) {
    return false;
  }

  const botHandScore = calculateHandScore(bot.hand);
  const otherPlayers = room.players.filter(
    (player) => player.id !== botId && player.score < SCORE_ELIMINATION_THRESHOLD
  );

  if (otherPlayers.length === 0) {
    return false;
  }

  const avgOpponentScore =
    otherPlayers.reduce((sum, player) => sum + calculateHandScore(player.hand), 0) /
    otherPlayers.length;

  return botHandScore < avgOpponentScore;
};

export const getBotControlledCurrentPlayer = (room: Room): Player | undefined => {
  if (room.gameStatus !== 'playing') {
    return undefined;
  }

  const currentPlayer = room.players[room.currentPlayerIndex];
  if (!currentPlayer || !shouldBotControl(room, currentPlayer.id)) {
    return undefined;
  }

  if (currentPlayer.score >= SCORE_ELIMINATION_THRESHOLD) {
    return undefined;
  }

  return currentPlayer;
};
