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

const SUIT_TEXT_CLASS_NAMES: Record<Suit, string> = {
  hearts: 'text-feedback-danger',
  diamonds: 'text-[#C2410C]',
  clubs: 'text-[#047857]',
  spades: 'text-text-on-card-face',
};

export function getSuitSymbol(suit: Suit): string {
  return SUIT_SYMBOLS[suit];
}

export function getSuitTextClassName(suit: Suit): string {
  return SUIT_TEXT_CLASS_NAMES[suit];
}
