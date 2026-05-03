import type { Card, Suit, SuitDisplayMode } from '@shedding-game/shared';

import { DEFAULT_SUIT_DISPLAY_MODE } from '@shedding-game/shared';

export function getCardKey(card: Card): string {
  return `${card.suit}-${card.rank}`;
}

const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const SUIT_TEXT_CLASS_NAMES_BY_MODE: Record<SuitDisplayMode, Record<Suit, string>> = {
  classic: {
    hearts: 'text-feedback-danger',
    diamonds: 'text-feedback-danger',
    clubs: 'text-text-on-card-face',
    spades: 'text-text-on-card-face',
  },
  distinct: {
    hearts: 'text-feedback-danger',
    diamonds: 'text-[#C2410C]',
    clubs: 'text-[#047857]',
    spades: 'text-text-on-card-face',
  },
};

export function getSuitSymbol(suit: Suit): string {
  return SUIT_SYMBOLS[suit];
}

export function getSuitTextClassName(
  suit: Suit,
  suitDisplayMode: SuitDisplayMode = DEFAULT_SUIT_DISPLAY_MODE
): string {
  return SUIT_TEXT_CLASS_NAMES_BY_MODE[suitDisplayMode][suit];
}
