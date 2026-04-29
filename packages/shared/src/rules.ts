import { BRIDGE_RANKS } from './constants';
import type { Card, Rank, Suit } from './types';

export type MoveRulesContext = {
  discardPile: Card[];
  activeSuit: Suit | null;
  penaltyCardsCount: number;
  isOpeningTurn?: boolean;
};

export type MoveValidationInput = MoveRulesContext & {
  hand: Card[];
  cards: Card[];
  chosenSuit?: Suit;
};

export type MoveRuleViolation =
  | { type: 'cards_required' }
  | { type: 'cards_not_in_hand' }
  | { type: 'same_rank_only' }
  | { type: 'penalty_requires_seven'; penaltyCardsCount: number }
  | { type: 'cannot_finish_with_six' }
  | { type: 'chosen_suit_required_for_jack' }
  | { type: 'after_six_restriction'; requiredSuit: Suit }
  | { type: 'opening_turn_rank_only'; requiredRank: Rank }
  | { type: 'active_suit_only'; requiredSuit: Suit }
  | { type: 'must_match_rank_or_suit'; requiredSuit: Suit; requiredRank: Rank };

export type ValidateMoveRulesOptions = {
  requireChosenSuitForJack?: boolean;
};

const hasCardInHand = (hand: Card[], card: Card): boolean => {
  return hand.some((handCard) => handCard.rank === card.rank && handCard.suit === card.suit);
};

export const validateMoveRules = (
  input: MoveValidationInput,
  options: ValidateMoveRulesOptions = {}
): MoveRuleViolation | null => {
  const { requireChosenSuitForJack = true } = options;
  const { hand, cards, chosenSuit, discardPile, activeSuit, penaltyCardsCount, isOpeningTurn } =
    input;

  if (cards.length === 0) return { type: 'cards_required' };

  if (!cards.every((card) => hasCardInHand(hand, card))) {
    return { type: 'cards_not_in_hand' };
  }

  const [firstPlayed] = cards;
  const firstRank = firstPlayed.rank;

  if (!cards.every((card) => card.rank === firstRank)) {
    return { type: 'same_rank_only' };
  }

  if (penaltyCardsCount > 0 && firstRank !== '7') {
    return { type: 'penalty_requires_seven', penaltyCardsCount };
  }

  if (firstRank === '6' && hand.length === cards.length) {
    return { type: 'cannot_finish_with_six' };
  }

  if (requireChosenSuitForJack && firstRank === 'J' && !chosenSuit) {
    return { type: 'chosen_suit_required_for_jack' };
  }

  if (discardPile.length === 0) return null;

  const topCard = discardPile[discardPile.length - 1];

  if (topCard.rank === '6') {
    if (firstPlayed.suit === topCard.suit || firstRank === '6' || firstRank === 'J') {
      return null;
    }

    return { type: 'after_six_restriction', requiredSuit: topCard.suit };
  }

  if (isOpeningTurn) {
    if (firstRank === topCard.rank) {
      return null;
    }

    return { type: 'opening_turn_rank_only', requiredRank: topCard.rank };
  }

  if (firstRank === 'J') return null;

  if (activeSuit) {
    if (firstPlayed.suit === activeSuit) {
      return null;
    }

    return { type: 'active_suit_only', requiredSuit: activeSuit };
  }

  if (firstRank === topCard.rank || firstPlayed.suit === topCard.suit) {
    return null;
  }

  return {
    type: 'must_match_rank_or_suit',
    requiredSuit: topCard.suit,
    requiredRank: topCard.rank,
  };
};

export const getPlayableCards = (hand: Card[], context: MoveRulesContext): Card[] => {
  return hand.filter(
    (card) =>
      validateMoveRules(
        {
          ...context,
          hand,
          cards: [card],
        },
        { requireChosenSuitForJack: false }
      ) === null
  );
};

export const getPlayableMoveGroups = (hand: Card[], context: MoveRulesContext): Card[][] => {
  const validMoves: Card[][] = [];
  const cardsByRank = new Map<Rank, Card[]>();

  hand.forEach((card) => {
    const existing = cardsByRank.get(card.rank) || [];
    existing.push(card);
    cardsByRank.set(card.rank, existing);
  });

  cardsByRank.forEach((cards) => {
    for (let count = 1; count <= cards.length; count++) {
      const cardsToPlay = cards.slice(0, count);
      if (
        validateMoveRules(
          {
            ...context,
            hand,
            cards: cardsToPlay,
          },
          { requireChosenSuitForJack: false }
        ) === null
      ) {
        validMoves.push(cardsToPlay);
      }
    }
  });

  return validMoves;
};

export const isBridgeAvailable = (discardPile: Card[]): boolean => {
  if (discardPile.length < 4) return false;

  const lastFour = discardPile.slice(-4);
  const rank = lastFour[0].rank;

  if (!BRIDGE_RANKS.includes(rank as (typeof BRIDGE_RANKS)[number])) return false;

  return lastFour.every((card) => card.rank === rank);
};

export const wouldCreateBridge = (cardsToPlay: Card[], discardPile: Card[]): boolean => {
  return isBridgeAvailable([...discardPile, ...cardsToPlay]);
};
