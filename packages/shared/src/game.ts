import shuffle from 'lodash.shuffle';

import { RANKS, SUITS } from './constants';
import type { Card, Rank } from './types';

export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  return shuffle(deck);
};

export const REACTIONS = [
  { id: 'emoji_1', emoji: '😂' },
  { id: 'emoji_2', emoji: '😡' },
  { id: 'emoji_3', emoji: '😢' },
] as const;

export type ReactionType = (typeof REACTIONS)[number]['id'];

/** Top 20 popular emojis for user to customize their reactions */
export const POPULAR_EMOJIS = [
  '😂',
  '😭',
  '🥹',
  '😍',
  '🥰',
  '😎',
  '🤔',
  '😡',
  '🤬',
  '😢',
  '🔥',
  '❤️',
  '👍',
  '👏',
  '🙏',
  '🎉',
  '😱',
  '🤯',
  '💪',
  '🤡',
] as const;

/** Get the display emoji for a reaction type, with optional user preferences override */
export const getReactionEmoji = (
  reactionId: ReactionType,
  userPreferences?: Record<string, string>
): string => {
  if (userPreferences?.[reactionId]) {
    return userPreferences[reactionId];
  }
  return REACTIONS.find((r) => r.id === reactionId)?.emoji ?? '😂';
};

export const getCardScore = (rank: Rank): number => {
  switch (rank) {
    case '6':
    case '7':
    case '8':
    case '9':
      return 0;
    case '10':
    case 'Q':
    case 'K':
      return 10;
    case 'J':
      return 20;
    case 'A':
      return 15;
    default:
      return 0;
  }
};

export const calculateHandScore = (hand: Card[]): number => {
  return hand.reduce((total, card) => total + getCardScore(card.rank), 0);
};
