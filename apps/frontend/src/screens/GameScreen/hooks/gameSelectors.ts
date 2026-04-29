import type { Card as CardType, Suit } from '@shedding-game/shared';

import {
  getPlayableCards as getPlayableCardsByRules,
  RANKS,
  SCORE_ELIMINATION_THRESHOLD,
} from '@shedding-game/shared';

import type { Player, RoomDetails } from '@/types/rooms';
import { getCardKey } from '@/utils/card';

export const EMPTY_CARDS: CardType[] = [];

type RoomPlayableState = Pick<
  RoomDetails,
  'players' | 'discardPile' | 'activeSuit' | 'penaltyCardsCount' | 'isOpeningTurn'
>;

type GameScreenWinner = Pick<Player, 'id' | 'name' | 'score'>;

export const sortCardsByRankDesc = (cards: CardType[]): CardType[] =>
  [...cards].sort((left, right) => RANKS.indexOf(right.rank) - RANKS.indexOf(left.rank));

export const getSelectableCards = (
  hand: CardType[],
  discardPile: CardType[],
  activeSuit: Suit | null,
  penaltyCardsCount: number,
  selectedCards: CardType[],
  isOpeningTurn?: boolean
): CardType[] => {
  if (hand.length === 0) return EMPTY_CARDS;

  if (selectedCards.length > 0) {
    const selectedRank = selectedCards[0].rank;
    return hand.filter((card) => card.rank === selectedRank);
  }

  return getPlayableCardsByRules(hand, {
    discardPile,
    activeSuit,
    penaltyCardsCount,
    isOpeningTurn,
  });
};

export const getPlayableCardKeys = (room: RoomPlayableState, playerIndex: number): Set<string> => {
  const player = room.players[playerIndex];
  const hand = Array.isArray(player?.hand) ? sortCardsByRankDesc(player.hand) : EMPTY_CARDS;
  const playableCards = getSelectableCards(
    hand,
    room.discardPile ?? EMPTY_CARDS,
    room.activeSuit,
    room.penaltyCardsCount,
    EMPTY_CARDS,
    room.isOpeningTurn
  );

  return new Set(playableCards.map(getCardKey));
};

export const getPlayerIndex = (
  room: Pick<RoomDetails, 'players'> | null,
  userId: string | undefined
) => {
  if (!room || !userId) {
    return -1;
  }

  return room.players.findIndex((player) => player.id === userId);
};

export const getPlayerAtIndex = (
  room: Pick<RoomDetails, 'players'> | null,
  playerIndex: number
): Player | undefined => {
  if (!room || playerIndex < 0) {
    return undefined;
  }

  return room.players[playerIndex];
};

export const getWinner = (room: RoomDetails | null): GameScreenWinner | undefined => {
  if (!room) {
    return undefined;
  }

  if (room.winnerId) {
    return (
      room.players.find((player) => player.id === room.winnerId) || {
        id: room.winnerId,
        name: room.winnerName || room.winnerId,
        score: 0,
      }
    );
  }

  return room.players.find(
    (player) => player.score < SCORE_ELIMINATION_THRESHOLD && !player.isLeaver
  );
};
