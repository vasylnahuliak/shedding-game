import type { Card, DebugMode, Rank } from '@shedding-game/shared';

/**
 * Extracts specific cards from the deck for debug mode hands.
 * Returns the cards that should be given to the host player.
 */
export function extractDebugHand(deck: Card[], debugMode: DebugMode | undefined): Card[] {
  if (!debugMode || debugMode === 'none') {
    return [];
  }

  const hostHand: Card[] = [];

  switch (debugMode) {
    case 'one_six_four_jacks':
      extractCard(deck, hostHand, '6');
      extractAllCardsOfRank(deck, hostHand, 'J');
      break;

    case 'one_jack_four_sevens':
      extractCard(deck, hostHand, 'J');
      extractAllCardsOfRank(deck, hostHand, '7');
      break;

    case 'one_jack_four_eights':
      extractCard(deck, hostHand, 'J');
      extractAllCardsOfRank(deck, hostHand, '8');
      break;

    case 'one_jack_four_sixes':
      extractCard(deck, hostHand, 'J');
      extractAllCardsOfRank(deck, hostHand, '6');
      break;

    case 'one_jack_four_kings':
      extractCard(deck, hostHand, 'J');
      extractAllCardsOfRank(deck, hostHand, 'K');
      break;

    case 'one_jack_four_aces':
      extractCard(deck, hostHand, 'J');
      extractAllCardsOfRank(deck, hostHand, 'A');
      break;
  }

  return hostHand;
}

/**
 * Extracts a single card of the given rank from the deck.
 */
function extractCard(deck: Card[], hand: Card[], rank: Rank): void {
  const index = deck.findIndex((c) => c.rank === rank);
  if (index !== -1) {
    hand.push(deck.splice(index, 1)[0]);
  }
}

/**
 * Extracts all cards of the given rank from the deck.
 */
function extractAllCardsOfRank(deck: Card[], hand: Card[], rank: Rank): void {
  const cards = deck.filter((c) => c.rank === rank);
  cards.forEach((c) => {
    const idx = deck.indexOf(c);
    if (idx !== -1) {
      deck.splice(idx, 1);
      hand.push(c);
    }
  });
}
