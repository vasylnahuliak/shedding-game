import type { Card } from '@shedding-game/shared';

import {
  createDeck as sharedCreateDeck,
  shuffleDeck as sharedShuffleDeck,
} from '@shedding-game/shared';

import type { Room } from '@/types';

export const createDeck = (): Card[] => {
  return sharedCreateDeck();
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  return sharedShuffleDeck(deck);
};

/**
 * Reshuffles cards from discard pile (except top card) into deck.
 * Returns true if reshuffle happened.
 */
export const reshuffleDeck = (room: Room): boolean => {
  if (room.discardPile.length <= 1) {
    return false; // Need at least 1 card to keep on top
  }

  // Keep top card, take rest for reshuffling
  const topCard = room.discardPile.pop();
  if (!topCard) {
    return false;
  }
  const cardsToReshuffle = room.discardPile.splice(0, room.discardPile.length);
  room.discardPile.push(topCard);

  // Shuffle and add to deck
  room.deck = shuffleDeck(cardsToReshuffle);
  room.reshuffleCount++;

  return true;
};

/**
 * Draws specified number of cards from deck into player's hand.
 * Handles reshuffle when deck is empty. Returns actual number of cards drawn.
 */
export const drawCardsFromDeck = (room: Room, player: { hand: Card[] }, count: number): number => {
  let drawn = 0;

  for (let i = 0; i < count; i++) {
    if (room.deck.length === 0) {
      if (!reshuffleDeck(room)) {
        // No cards available anywhere
        break;
      }
    }

    if (room.deck.length > 0) {
      const card = room.deck.pop();
      if (card) {
        player.hand.push(card);
        drawn++;
      }
    }
  }

  return drawn;
};
