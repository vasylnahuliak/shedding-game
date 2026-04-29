import type { Card, Suit } from '@shedding-game/shared';

export function getCardKey(card: Card): string {
  return `${card.suit}-${card.rank}`;
}

const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const RED_SUITS: Suit[] = ['hearts', 'diamonds'];

export function getSuitSymbol(suit: Suit): string {
  return SUIT_SYMBOLS[suit];
}

export function isRedSuit(suit: Suit): boolean {
  return RED_SUITS.includes(suit);
}
