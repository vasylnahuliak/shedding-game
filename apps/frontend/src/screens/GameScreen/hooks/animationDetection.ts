import type { Card as CardType } from '@shedding-game/shared';

import type { RoomDetails } from '@/types/rooms';
import { getCardKey } from '@/utils/card';

import { sortCardsByRankDesc } from './gameSelectors';

export type OpponentDraw = { playerId: string; count: number };

type Player = RoomDetails['players'][number];

/** Helper to get hand count from a player (handles both Card[] and number) */
function getHandCount(player: Player | undefined): number {
  if (!player) return 0;
  return typeof player.hand === 'number' ? player.hand : player.hand.length;
}

/** Helper to get hands as Card[] for player comparison */
function getHandAsArray(player: Player | undefined): CardType[] {
  if (!player) return [];
  return Array.isArray(player.hand) ? player.hand : [];
}

/** Get prev and new hands for a player */
function getPlayerHands(
  prevRoom: RoomDetails,
  updatedRoom: RoomDetails,
  userId: string
): { prevHand: CardType[]; newHand: CardType[] } {
  const prevPlayer = prevRoom.players.find((p) => p.id === userId);
  const newPlayer = updatedRoom.players.find((p) => p.id === userId);
  return {
    prevHand: getHandAsArray(prevPlayer),
    newHand: getHandAsArray(newPlayer),
  };
}

function getDiscardPileGrowth(prevRoom: RoomDetails, updatedRoom: RoomDetails): CardType[] | null {
  if (prevRoom.gameStatus !== 'playing') return null;

  const prevDiscard = prevRoom.discardPile || [];
  const newDiscard = updatedRoom.discardPile || [];
  if (newDiscard.length <= prevDiscard.length) return null;

  return newDiscard.slice(prevDiscard.length);
}

type OpponentHandChange = { player: Player; prevCount: number; newCount: number };

/** Iterate over opponents and yield their hand count changes */
function* getOpponentHandChanges(
  prevRoom: RoomDetails,
  updatedRoom: RoomDetails,
  myUserId: string | undefined
): Generator<OpponentHandChange> {
  for (const player of updatedRoom.players) {
    if (player.id === myUserId) continue;
    const prevPlayer = prevRoom.players.find((p) => p.id === player.id);
    if (!prevPlayer) continue;

    yield {
      player,
      prevCount: getHandCount(prevPlayer),
      newCount: getHandCount(player),
    };
  }
}

function collectOpponentHandChanges<T>(
  prevRoom: RoomDetails,
  updatedRoom: RoomDetails,
  myUserId: string | undefined,
  selector: (change: OpponentHandChange) => T | null
): T[] {
  const results: T[] = [];

  for (const change of getOpponentHandChanges(prevRoom, updatedRoom, myUserId)) {
    const result = selector(change);
    if (result) {
      results.push(result);
    }
  }

  return results;
}

/** Detect cards drawn by the current player (hand is Card[]) */
export function detectPlayerDrawnCards(
  prevRoom: RoomDetails,
  updatedRoom: RoomDetails,
  userId: string | undefined
): { drawnCards: CardType[]; sortedNewHand: CardType[] } {
  const empty = { drawnCards: [], sortedNewHand: [] };
  if (!userId || prevRoom.gameStatus !== 'playing') return empty;

  const { prevHand, newHand } = getPlayerHands(prevRoom, updatedRoom, userId);

  if (newHand.length <= prevHand.length) return empty;

  const prevKeys = new Set(prevHand.map(getCardKey));
  const drawnCards = newHand.filter((c) => !prevKeys.has(getCardKey(c)));
  if (drawnCards.length === 0) return empty;

  const sortedNewHand = sortCardsByRankDesc(newHand);
  return { drawnCards, sortedNewHand };
}

/** Detect cards played by the current player (hand shrank → discard grew) */
export function detectPlayerPlayedCards(
  prevRoom: RoomDetails,
  updatedRoom: RoomDetails,
  userId: string | undefined
): { playedCards: CardType[]; sortedPrevHand: CardType[] } {
  const empty = { playedCards: [] as CardType[], sortedPrevHand: [] as CardType[] };
  if (!userId || prevRoom.gameStatus !== 'playing') return empty;

  const { prevHand, newHand } = getPlayerHands(prevRoom, updatedRoom, userId);

  if (newHand.length >= prevHand.length) return empty;

  if (!getDiscardPileGrowth(prevRoom, updatedRoom)) return empty;

  const newKeys = new Set(newHand.map(getCardKey));
  const playedCards = prevHand.filter((c) => !newKeys.has(getCardKey(c)));
  if (playedCards.length === 0) return empty;

  const sortedPrevHand = sortCardsByRankDesc(prevHand);
  return { playedCards, sortedPrevHand };
}

export type OpponentPlay = { playerId: string; cards: CardType[] };

/** Detect cards played by an opponent (hand count shrank + discard grew) */
export function detectOpponentPlayedCards(
  prevRoom: RoomDetails,
  updatedRoom: RoomDetails,
  myUserId: string | undefined
): OpponentPlay[] {
  const discardPileGrowth = getDiscardPileGrowth(prevRoom, updatedRoom);
  if (!discardPileGrowth) return [];

  return collectOpponentHandChanges(prevRoom, updatedRoom, myUserId, (change) => {
    if (change.newCount >= change.prevCount) {
      return null;
    }

    const playedCount = change.prevCount - change.newCount;
    return { playerId: change.player.id, cards: discardPileGrowth.slice(-playedCount) };
  });
}

/** Detect cards drawn by opponents (hand is a number) */
export function detectOpponentDraws(
  prevRoom: RoomDetails,
  updatedRoom: RoomDetails,
  myUserId: string | undefined
): OpponentDraw[] {
  if (prevRoom.gameStatus !== 'playing') return [];

  return collectOpponentHandChanges(prevRoom, updatedRoom, myUserId, (change) => {
    if (change.newCount <= change.prevCount) {
      return null;
    }

    return { playerId: change.player.id, count: change.newCount - change.prevCount };
  });
}
