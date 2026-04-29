import type { BotPersonaName, Card, Suit } from '@shedding-game/shared';
import crypto from 'crypto';

import { formatBotDisplayName, getAvailableBotPersonaNames } from '@shedding-game/shared';

import { roomRepository } from '@/db/repositories/roomRepository';
import type { Room } from '@/types';

import {
  chooseBestMove,
  chooseBestSuit,
  getBotControlledCurrentPlayer,
  getPlayableCards,
  shouldApplyBridge,
  shouldAvoidRiskySixMove,
  shouldBotControl,
} from './botStrategy';
import {
  applyBridge,
  declineBridge,
  drawCard,
  forceAdvanceTurnWhenStuck,
  makeMove,
  passTurn,
} from './game';
import { scheduleGameJob } from './jobRunner';
import { withRoomLock } from './roomMutex';
import { saveRoomWithAutoArchive } from './roomPersistence';
import { broadcastRoomUpdate } from './socket';

const BOT_DELAY_MS_MIN = 800;
const BOT_DELAY_MS_MAX = 2500;
const BOT_RISKY_SIX_DRAW_BEFORE_PASS_CHANCE = 0.15;
const BOT_DEAL_ANIMATION_DELAY_MS = 6000;
const getBotDelayMs = () =>
  BOT_DELAY_MS_MIN + Math.random() * (BOT_DELAY_MS_MAX - BOT_DELAY_MS_MIN);

const getRoomBotDisplayNames = (room: Room) =>
  room.players.filter((player) => player.playerType === 'bot').map((player) => player.name);

export const generateBotDisplayName = (room: Room): string => {
  const availableNames = getAvailableBotPersonaNames(getRoomBotDisplayNames(room));

  if (availableNames.length === 0) {
    throw new Error('No bot names available.');
  }

  return formatBotDisplayName(availableNames[crypto.randomInt(availableNames.length)]);
};

export const canUseBotPersonaName = (
  room: Room,
  name: BotPersonaName,
  currentBotName?: string
): boolean => {
  const availableNames = getAvailableBotPersonaNames(getRoomBotDisplayNames(room), currentBotName);
  return availableNames.includes(name);
};

export const applyBotPersonaName = (room: Room, botId: string, name: BotPersonaName): boolean => {
  const bot = room.players.find((player) => player.id === botId && player.playerType === 'bot');
  if (!bot) {
    return false;
  }

  bot.name = formatBotDisplayName(name);
  return true;
};

export const executeBotTurn = async (roomId: string): Promise<void> => {
  let updatedRoom: Room | null = null;
  let shouldScheduleNext = false;

  await withRoomLock(roomId, async () => {
    const room = await roomRepository.loadRoom(roomId);
    if (!room) return;

    const previousStatus = room.gameStatus;
    const currentPlayer = getBotControlledCurrentPlayer(room);
    const persistBotTurnResult = async (scheduleNext: boolean) => {
      await saveRoomWithAutoArchive(room, previousStatus);
      updatedRoom = room;
      shouldScheduleNext = scheduleNext;
    };

    if (room.bridgeAvailable && room.bridgePlayerId) {
      if (!shouldBotControl(room, room.bridgePlayerId)) {
        return;
      }

      if (shouldApplyBridge(room, room.bridgePlayerId)) {
        if (!applyBridge(room, room.bridgePlayerId)) {
          return;
        }
      } else if (!declineBridge(room, room.bridgePlayerId)) {
        return;
      }

      await persistBotTurnResult(room.gameStatus === 'playing');
      return;
    }

    if (!currentPlayer) return;

    const tryPlayMove = async (move: { cards: Card[]; chosenSuit?: Suit }, moves: Card[][]) => {
      const shouldAvoidThisSixMove = shouldAvoidRiskySixMove(room, currentPlayer.hand, moves, move);

      if (shouldAvoidThisSixMove && room.hasDrawnThisTurn) {
        return false;
      }

      makeMove(room, currentPlayer.id, move.cards, move.chosenSuit);
      await persistBotTurnResult(room.gameStatus === 'playing');
      return true;
    };

    const validMoves = getPlayableCards(room, currentPlayer.id);

    if (validMoves.length > 0) {
      const move = chooseBestMove(room, currentPlayer.id, validMoves);
      if (move) {
        const shouldAvoidThisSixMove = shouldAvoidRiskySixMove(
          room,
          currentPlayer.hand,
          validMoves,
          move
        );

        if (
          shouldAvoidThisSixMove &&
          !room.hasDrawnThisTurn &&
          Math.random() < BOT_RISKY_SIX_DRAW_BEFORE_PASS_CHANCE &&
          drawCard(room, currentPlayer.id)
        ) {
          await persistBotTurnResult(true);
          return;
        }

        if (await tryPlayMove(move, validMoves)) {
          return;
        }
      }
    }

    if (room.isOpeningTurn && room.hasDrawnThisTurn) {
      const passTop = room.discardPile[room.discardPile.length - 1];
      let openPassSuit: Suit | undefined;
      if (passTop?.rank === 'J') {
        openPassSuit = chooseBestSuit(currentPlayer.hand);
      }
      if (passTurn(room, currentPlayer.id, openPassSuit)) {
        await persistBotTurnResult(room.gameStatus === 'playing');
        return;
      }
    }

    const topCard = room.discardPile[room.discardPile.length - 1];
    const isTopSix = topCard && topCard.rank === '6';

    if (room.penaltyCardsCount > 0 || !room.hasDrawnThisTurn || isTopSix) {
      if (drawCard(room, currentPlayer.id)) {
        await persistBotTurnResult(true);
        return;
      }
      if (forceAdvanceTurnWhenStuck(room, currentPlayer.id)) {
        await persistBotTurnResult(room.gameStatus === 'playing');
        return;
      }
    }

    const movesAfterDraw = getPlayableCards(room, currentPlayer.id);
    if (movesAfterDraw.length > 0) {
      const move = chooseBestMove(room, currentPlayer.id, movesAfterDraw);
      if (move && (await tryPlayMove(move, movesAfterDraw))) {
        return;
      }
    }

    const passTopCard = room.discardPile[room.discardPile.length - 1];
    let passChosenSuit: Suit | undefined;
    if (room.isOpeningTurn && passTopCard?.rank === 'J') {
      passChosenSuit = chooseBestSuit(currentPlayer.hand);
    }

    if (passTurn(room, currentPlayer.id, passChosenSuit)) {
      await persistBotTurnResult(room.gameStatus === 'playing');
      return;
    }

    if (forceAdvanceTurnWhenStuck(room, currentPlayer.id)) {
      await persistBotTurnResult(room.gameStatus === 'playing');
    }
  });

  if (updatedRoom) {
    await broadcastRoomUpdate(updatedRoom);
  }
  if (updatedRoom && shouldScheduleNext) {
    scheduleBotTurn(updatedRoom);
  }
};

const resolveRoomId = (roomOrId: Room | string): string =>
  typeof roomOrId === 'string' ? roomOrId : roomOrId.id;

export const scheduleBotTurn = (roomOrId: Room | string): void => {
  const room = typeof roomOrId === 'string' ? null : roomOrId;
  const roomId = room?.id ?? (roomOrId as string);

  const scheduleFromRoom = (r: Room): void => {
    if (r.gameStatus !== 'playing') return;

    if (r.bridgeAvailable && r.bridgePlayerId) {
      if (!shouldBotControl(r, r.bridgePlayerId)) return;
    } else {
      const currentPlayer = getBotControlledCurrentPlayer(r);
      if (!currentPlayer) return;
    }

    void scheduleGameJob(
      'bot_turn',
      { roomId },
      {
        delayMs: getBotDelayMs(),
        dedupeKey: `bot-turn:${roomId}`,
      }
    );
  };

  if (room) {
    scheduleFromRoom(room);
    return;
  }

  void (async () => {
    const loaded = await roomRepository.loadRoom(roomId);
    if (!loaded) return;
    scheduleFromRoom(loaded);
  })();
};

/**
 * Schedule bot turn after dealing cards, with additional delay for dealing animation.
 * Use this instead of scheduleBotTurn after starting a round or dealing cards.
 */
export const scheduleBotTurnAfterDeal = (roomOrId: Room | string): void => {
  const roomId = resolveRoomId(roomOrId);

  void scheduleGameJob(
    'bot_turn',
    { roomId },
    {
      delayMs: BOT_DEAL_ANIMATION_DELAY_MS,
      dedupeKey: `bot-turn:${roomId}`,
    }
  );
};
