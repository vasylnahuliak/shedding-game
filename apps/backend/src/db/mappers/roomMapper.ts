import type {
  Prisma,
  RoundScoreEventType,
  Suit as PrismaSuit,
  UserType as PrismaUserType,
} from '@prisma/client';
import { RoomCardLocation } from '@prisma/client';
import type {
  BackendMessageCode,
  Card,
  DebugMode,
  GamePace,
  GameStatus,
  Rank,
  Suit,
  UserType,
} from '@shedding-game/shared';

import { DEFAULT_GAME_PACE } from '@shedding-game/shared';

import type { ClosedGame, Room, RoundScore, RoundScoreEvent } from '@/types';

type RoomRecord = Prisma.RoomGetPayload<{
  include: {
    players: { orderBy: { turnOrder: 'asc' } };
    cards: { orderBy: { position: 'asc' } };
    readyPlayers: true;
    rounds: {
      include: { entries: { orderBy: { entryOrder: 'asc' } } };
      orderBy: { roundIndex: 'asc' };
    };
  };
}>;

type ClosedGameRecord = Prisma.ClosedGameGetPayload<{
  include: { players: { orderBy: { playerOrder: 'asc' } } };
}>;

const toMs = (value: bigint | null | undefined): number | undefined => {
  if (value == null) return undefined;
  return Number(value);
};

const toBigInt = (value: number | null | undefined): bigint | null => {
  if (value == null) return null;
  return BigInt(value);
};

const mapEventTypeFromDb = (eventType: RoundScoreEventType | null): RoundScoreEvent | undefined => {
  if (!eventType) return undefined;
  return { type: eventType as RoundScoreEvent['type'] };
};

const mapEventTypeToDb = (event?: RoundScoreEvent): RoundScoreEventType | null => {
  if (!event) return null;
  return event.type as RoundScoreEventType;
};

const mapCardFromDb = (card: { suit: PrismaSuit; rank: string }): Card => {
  return {
    suit: card.suit as Suit,
    rank: card.rank as Rank,
  };
};

const mapCardToDb = (card: Card): { suit: PrismaSuit; rank: string } => ({
  suit: card.suit as PrismaSuit,
  rank: card.rank,
});

export const mapRoomFromDb = (record: RoomRecord): Room => {
  const handCards = new Map<string, Card[]>();

  const deck = record.cards
    .filter((card) => card.location === RoomCardLocation.deck)
    .map(mapCardFromDb);
  const discardPile = record.cards
    .filter((card) => card.location === RoomCardLocation.discard)
    .map(mapCardFromDb);
  const bridgeLastCards = record.cards
    .filter((card) => card.location === RoomCardLocation.bridge_last)
    .map(mapCardFromDb);

  for (const card of record.cards) {
    if (card.location !== RoomCardLocation.hand || !card.ownerPlayerId) continue;
    const cards = handCards.get(card.ownerPlayerId) ?? [];
    cards.push(mapCardFromDb(card));
    handCards.set(card.ownerPlayerId, cards);
  }

  const scoreHistory: RoundScore[][] = record.rounds.map((round) =>
    round.entries.map((entry) => ({
      playerId: entry.playerId,
      scoreChange: entry.scoreChange,
      totalScore: entry.totalScore,
      event: mapEventTypeFromDb(entry.eventType),
    }))
  );

  return {
    id: record.id,
    name: record.name,
    hostId: record.hostId,
    createdAt: Number(record.createdAtMs),
    lastActivityAt: Number(record.lastActivityAtMs),
    turnStartedAt: toMs(record.turnStartedAtMs),
    gamePace: (record.gamePace as GamePace | null) ?? DEFAULT_GAME_PACE,
    players: record.players.map((player) => ({
      id: player.playerId,
      name: player.name,
      playerType: player.playerType as UserType,
      hand: handCards.get(player.playerId) ?? [],
      score: player.score,
      isLeaver: player.isLeaver || undefined,
    })),
    deck,
    discardPile,
    currentPlayerIndex: record.currentPlayerIndex,
    gameStatus: record.gameStatus as GameStatus,
    penaltyCardsCount: record.penaltyCardsCount,
    activeSuit: (record.activeSuit as Suit | null) ?? null,
    debugMode: (record.debugMode as DebugMode | undefined) ?? undefined,
    hasDrawnThisTurn: record.hasDrawnThisTurn,
    scoreHistory,
    reshuffleCount: record.reshuffleCount,
    bridgeAvailable: record.bridgeAvailable,
    bridgePlayerId: record.bridgePlayerId,
    bridgeLastCards: bridgeLastCards.length > 0 ? bridgeLastCards : null,
    readyForNextRoundPlayerIds:
      record.readyPlayers.length > 0
        ? record.readyPlayers.map((readyPlayer) => readyPlayer.playerId)
        : undefined,
    isOpeningTurn: record.isOpeningTurn,
    gameStartedAt: toMs(record.gameStartedAtMs),
    gameFinishedAt: toMs(record.gameFinishedAtMs),
    winnerId: record.winnerId ?? undefined,
    winnerName: record.winnerName ?? undefined,
  };
};

export const mapRoomToDb = (room: Room) => {
  const players = room.players.map((player, turnOrder) => ({
    roomId: room.id,
    playerId: player.id,
    name: player.name,
    playerType: player.playerType as PrismaUserType,
    score: player.score,
    isLeaver: Boolean(player.isLeaver),
    turnOrder,
  }));

  const cards = [
    ...room.deck.map((card, position) => {
      const mapped = mapCardToDb(card);
      return {
        roomId: room.id,
        location: RoomCardLocation.deck,
        ownerPlayerId: null,
        position,
        suit: mapped.suit,
        rank: mapped.rank,
      };
    }),
    ...room.discardPile.map((card, position) => {
      const mapped = mapCardToDb(card);
      return {
        roomId: room.id,
        location: RoomCardLocation.discard,
        ownerPlayerId: null,
        position,
        suit: mapped.suit,
        rank: mapped.rank,
      };
    }),
    ...room.players.flatMap((player) =>
      player.hand.map((card, position) => {
        const mapped = mapCardToDb(card);
        return {
          roomId: room.id,
          location: RoomCardLocation.hand,
          ownerPlayerId: player.id,
          position,
          suit: mapped.suit,
          rank: mapped.rank,
        };
      })
    ),
    ...((room.bridgeLastCards ?? []).map((card, position) => {
      const mapped = mapCardToDb(card);
      return {
        roomId: room.id,
        location: RoomCardLocation.bridge_last,
        ownerPlayerId: null,
        position,
        suit: mapped.suit,
        rank: mapped.rank,
      };
    }) ?? []),
  ];

  const readyPlayers = (room.readyForNextRoundPlayerIds ?? []).map((playerId) => ({
    roomId: room.id,
    playerId,
  }));

  const rounds = room.scoreHistory.map((entries, roundIndex) => ({
    roundIndex,
    entries: entries.map((entry, entryOrder) => ({
      entryOrder,
      playerId: entry.playerId,
      scoreChange: entry.scoreChange,
      totalScore: entry.totalScore,
      eventType: mapEventTypeToDb(entry.event),
    })),
  }));

  return {
    room: {
      id: room.id,
      name: room.name,
      hostId: room.hostId,
      createdAtMs: BigInt(room.createdAt),
      lastActivityAtMs: BigInt(room.lastActivityAt),
      turnStartedAtMs: toBigInt(room.turnStartedAt),
      gamePace: room.gamePace,
      gameStatus: room.gameStatus,
      currentPlayerIndex: room.currentPlayerIndex,
      penaltyCardsCount: room.penaltyCardsCount,
      activeSuit: room.activeSuit as PrismaSuit | null,
      debugMode: room.debugMode ?? null,
      hasDrawnThisTurn: room.hasDrawnThisTurn,
      reshuffleCount: room.reshuffleCount,
      bridgeAvailable: room.bridgeAvailable,
      bridgePlayerId: room.bridgePlayerId,
      isOpeningTurn: room.isOpeningTurn,
      gameStartedAtMs: toBigInt(room.gameStartedAt),
      gameFinishedAtMs: toBigInt(room.gameFinishedAt),
      winnerId: room.winnerId ?? null,
      winnerName: room.winnerName ?? null,
    },
    players,
    cards,
    readyPlayers,
    rounds,
  };
};

const isReasonParams = (value: unknown): value is Record<string, string | number> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

  return Object.values(value).every((item) => typeof item === 'string' || typeof item === 'number');
};

type ClosedGameArchiveInput = Omit<ClosedGame, 'id'>;

export const mapClosedGameToDb = (
  game: ClosedGameArchiveInput,
  reasonCode?: BackendMessageCode,
  reasonParams?: Record<string, string | number>
) => {
  return {
    roomId: game.roomId,
    name: game.name,
    hostId: game.hostId,
    gameStatus: game.gameStatus,
    roundsPlayed: game.roundsPlayed ?? 0,
    createdAtMs: toBigInt(game.createdAt),
    gameStartedAtMs: toBigInt(game.gameStartedAt),
    gameFinishedAtMs: toBigInt(game.gameFinishedAt),
    closedAtMs: BigInt(game.closedAt),
    closedReasonCode: reasonCode ?? game.closedReasonCode ?? null,
    closedReasonParams: reasonParams ?? game.closedReasonParams ?? undefined,
    players: game.players.map((player, playerOrder) => ({
      playerOrder,
      playerId: player.id,
      name: player.name,
      score: player.score,
      playerType: player.playerType as PrismaUserType,
      isLeaver: Boolean(player.isLeaver),
    })),
  };
};

export const mapClosedGameFromDb = (record: ClosedGameRecord): ClosedGame => {
  return {
    id: record.archiveId,
    roomId: record.roomId,
    name: record.name,
    hostId: record.hostId,
    gameStatus: record.gameStatus as GameStatus,
    players: record.players.map((player) => ({
      id: player.playerId,
      name: player.name,
      score: player.score,
      playerType: player.playerType as UserType,
      isLeaver: player.isLeaver || undefined,
    })),
    roundsPlayed: record.roundsPlayed,
    createdAt: toMs(record.createdAtMs),
    gameStartedAt: toMs(record.gameStartedAtMs),
    gameFinishedAt: toMs(record.gameFinishedAtMs),
    closedAt: Number(record.closedAtMs),
    closedReasonCode: (record.closedReasonCode as BackendMessageCode | null) ?? undefined,
    closedReasonParams: isReasonParams(record.closedReasonParams)
      ? record.closedReasonParams
      : undefined,
  };
};
