import type { Room } from '@/types';

export const resetRoomForRecreation = (
  room: Room,
  connectedUserIds: Set<string>,
  hasSocketServer: boolean
) => {
  room.players = room.players
    .filter(
      (player) =>
        player.playerType === 'bot' ||
        (!player.isLeaver && (!hasSocketServer || connectedUserIds.has(player.id)))
    )
    .map((player) => ({
      ...player,
      hand: [],
      score: 0,
      isLeaver: undefined,
      isOnline: undefined,
    }));
  room.deck = [];
  room.discardPile = [];
  room.currentPlayerIndex = 0;
  room.gameStatus = 'waiting';
  room.penaltyCardsCount = 0;
  room.activeSuit = null;
  room.hasDrawnThisTurn = false;
  room.scoreHistory = [];
  room.reshuffleCount = 0;
  room.bridgeAvailable = false;
  room.bridgePlayerId = null;
  room.bridgeLastCards = null;
  room.readyForNextRoundPlayerIds = undefined;
  room.isOpeningTurn = false;
  room.createdAt = Date.now();
  room.lastActivityAt = Date.now();
  room.turnStartedAt = undefined;
  room.gameStartedAt = undefined;
  room.gameFinishedAt = undefined;
  room.winnerId = undefined;
  room.winnerName = undefined;
};
