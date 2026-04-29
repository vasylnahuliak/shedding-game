import type { Card as CardType } from '@shedding-game/shared';

import type { Player, RoomDetails } from '@/types/rooms';

export type RoundStartDealEvent = {
  playerId: string;
  delay: number;
  card?: CardType;
};

const getPlayerHandCount = (player: Player): number =>
  typeof player.hand === 'number' ? player.hand : player.hand.length;

const getPlayersByDealOrder = (room: RoomDetails): Player[] =>
  room.players.map(
    (_, index) => room.players[(room.currentPlayerIndex + index) % room.players.length]
  );

export const getRoundStartAnimationToken = (room: RoomDetails): string | null => {
  if (room.gameStatus !== 'playing' || !room.isOpeningTurn || room.discardPile.length !== 1) {
    return null;
  }

  const topCard = room.discardPile[0];
  return [
    room.scoreHistory?.length ?? 0,
    room.currentPlayerIndex,
    room.deck,
    `${topCard.rank}${topCard.suit}`,
  ].join(':');
};

export const createInitialOpponentRevealCounts = (
  room: RoomDetails,
  myUserId: string | undefined
): Record<string, number> =>
  Object.fromEntries(
    room.players.filter((player) => player.id !== myUserId).map((player) => [player.id, 0])
  );

export const buildRoundStartDealEvents = (
  room: RoomDetails,
  userId: string,
  dealStaggerDelay: number
): {
  events: RoundStartDealEvent[];
  myCardsInDealOrder: CardType[];
  playersByDealOrder: Player[];
} => {
  const playersByDealOrder = getPlayersByDealOrder(room);
  const handCountByPlayerId = new Map(
    room.players.map((player) => [player.id, getPlayerHandCount(player)])
  );
  const maxHandCount = Math.max(
    ...playersByDealOrder.map((player) => handCountByPlayerId.get(player.id) ?? 0),
    0
  );

  const myPlayer = room.players.find((player) => player.id === userId);
  const myCardsInDealOrder = Array.isArray(myPlayer?.hand) ? myPlayer.hand : [];

  const events: RoundStartDealEvent[] = [];
  let dealtToMe = 0;

  for (let round = 0; round < maxHandCount; round++) {
    for (const player of playersByDealOrder) {
      const handCount = handCountByPlayerId.get(player.id) ?? 0;
      if (round >= handCount) continue;

      const event: RoundStartDealEvent = {
        playerId: player.id,
        delay: events.length * dealStaggerDelay,
      };

      if (player.id === userId) {
        const card = myCardsInDealOrder[dealtToMe];
        if (card) event.card = card;
        dealtToMe++;
      }

      events.push(event);
    }
  }

  return { events, myCardsInDealOrder, playersByDealOrder };
};
