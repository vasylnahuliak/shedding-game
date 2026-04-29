import { safeParseClientSocketEvent } from '@shedding-game/shared';

import { roomRepository } from '@/db/repositories/roomRepository';
import type { Room } from '@/types';

import { scheduleBotTurn, scheduleBotTurnAfterDeal } from './bot';
import {
  applyBridge,
  dealCards,
  declineBridge,
  drawCard,
  makeMoveWithError,
  passTurn,
  resolveDeadlockIfNeeded,
} from './game';
import { emitSocketError } from './messages';
import { withRoomLock } from './roomMutex';
import { saveRoomWithAutoArchive } from './roomPersistence';
import type { SocketConnectionHelpers } from './socketConnectionHelpers';
import { emitServerSocketEvent } from './socketEvents';
import { getSocketServer } from './socketRuntime';
import { getRoundReadyData } from './socketScheduling';
import type { AppSocket, MessageParams } from './socketTypes';

type RegisterSocketGameHandlersParams = {
  socket: AppSocket;
  canConsumeEvent: (event: string) => Promise<boolean>;
  helpers: SocketConnectionHelpers;
};

export const registerSocketGameHandlers = ({
  socket,
  canConsumeEvent,
  helpers,
}: RegisterSocketGameHandlersParams) => {
  socket.on('make_move', async (raw: unknown) => {
    if (!(await canConsumeEvent('make_move'))) return;
    const parsed = safeParseClientSocketEvent('make_move', raw);
    if (!parsed.success) return;

    const { applyBridgeAfterMove, cards, chosenSuit, roomId } = parsed.output;
    const updatedRoom = await helpers.runLockedRoomMutation(roomId, (room) => {
      const error = makeMoveWithError(room, socket.data.userId, cards, chosenSuit);
      if (error) {
        emitSocketError(
          socket,
          socket.data.locale,
          error.code,
          error.params as MessageParams<typeof error.code> | undefined
        );
        return false;
      }

      if (
        applyBridgeAfterMove &&
        room.bridgeAvailable &&
        room.bridgePlayerId === socket.data.userId
      ) {
        applyBridge(room, socket.data.userId);
      }

      return true;
    });
    if (!updatedRoom) return;

    await helpers.broadcastUpdatedRoomResult(
      updatedRoom.room,
      true,
      scheduleBotTurn,
      updatedRoom.deadlockResolved
    );
  });

  socket.on('draw_card', async (raw: unknown) => {
    if (!(await canConsumeEvent('draw_card'))) return;
    const parsed = safeParseClientSocketEvent('draw_card', raw);
    if (!parsed.success) return;
    await helpers.runRoomMutationAndContinueTurn(
      parsed.output.roomId,
      'SOCKET_CANNOT_DRAW',
      (room) => drawCard(room, socket.data.userId)
    );
  });

  socket.on('pass_turn', async (raw: unknown) => {
    if (!(await canConsumeEvent('pass_turn'))) return;
    const parsed = safeParseClientSocketEvent('pass_turn', raw);
    if (!parsed.success) return;
    await helpers.runRoomMutationAndContinueTurn(
      parsed.output.roomId,
      'SOCKET_CANNOT_PASS',
      (room) => passTurn(room, socket.data.userId, parsed.output.chosenSuit)
    );
  });

  socket.on('player_ready_next_round', async (raw: unknown) => {
    if (!(await canConsumeEvent('player_ready_next_round'))) return;
    const result = await helpers.runParsedRoomAction(
      'player_ready_next_round',
      raw,
      async ({ roomId }, userId) =>
        withRoomLock(
          roomId,
          async (): Promise<{
            updatedRoom: Room | null;
            shouldScheduleBotAfterDeal: boolean;
            deadlockResolved: boolean;
          }> => {
            const room = await roomRepository.loadRoom(roomId);
            if (!room || room.gameStatus !== 'round_over') {
              return {
                updatedRoom: null,
                shouldScheduleBotAfterDeal: false,
                deadlockResolved: false,
              };
            }

            const readiness = getRoundReadyData(room);
            if (readiness.ready.includes(userId)) {
              return {
                updatedRoom: null,
                shouldScheduleBotAfterDeal: false,
                deadlockResolved: false,
              };
            }

            const readyForNextRoundPlayerIds = [...readiness.ready, userId];
            room.readyForNextRoundPlayerIds = readyForNextRoundPlayerIds;

            const allReady = readiness.mustBeReady.every((id) =>
              readyForNextRoundPlayerIds.includes(id)
            );

            const previousStatus = room.gameStatus;
            let shouldScheduleBotAfterDeal = false;
            let deadlockResolved = false;

            if (allReady) {
              dealCards(room, room.currentPlayerIndex);
              deadlockResolved = resolveDeadlockIfNeeded(room);
              shouldScheduleBotAfterDeal = true;
            }

            await saveRoomWithAutoArchive(room, previousStatus);
            return { updatedRoom: room, shouldScheduleBotAfterDeal, deadlockResolved };
          }
        )
    );
    if (!result) return;

    await helpers.broadcastUpdatedRoomResult(
      result.updatedRoom,
      result.shouldScheduleBotAfterDeal,
      scheduleBotTurnAfterDeal,
      result.deadlockResolved
    );
  });

  socket.on('apply_bridge', async (raw: unknown) => {
    if (!(await canConsumeEvent('apply_bridge'))) return;
    const parsed = safeParseClientSocketEvent('apply_bridge', raw);
    if (!parsed.success) return;
    await helpers.runRoomMutationAndContinueTurn(
      parsed.output.roomId,
      'SOCKET_CANNOT_APPLY_BRIDGE',
      (room) => applyBridge(room, socket.data.userId)
    );
  });

  socket.on('emoji_reaction', async (raw: unknown) => {
    if (!(await canConsumeEvent('emoji_reaction'))) return;
    const socketServer = getSocketServer();
    if (!socketServer) return;

    const parsed = safeParseClientSocketEvent('emoji_reaction', raw);
    if (!parsed.success) return;

    const { actualEmoji, emoji, roomId } = parsed.output;
    const room = await roomRepository.loadRoom(roomId);
    if (!room) return;

    const player = room.players.find((candidate) => candidate.id === socket.data.userId);
    if (!player) return;

    emitServerSocketEvent(socketServer.in(roomId), 'emoji_reaction', {
      userId: socket.data.userId,
      playerName: player.name,
      emoji,
      actualEmoji,
    });
  });

  socket.on('decline_bridge', async (raw: unknown) => {
    if (!(await canConsumeEvent('decline_bridge'))) return;
    const parsed = safeParseClientSocketEvent('decline_bridge', raw);
    if (!parsed.success) return;
    await helpers.runRoomMutationAndContinueTurn(
      parsed.output.roomId,
      'SOCKET_CANNOT_DECLINE_BRIDGE',
      (room) => declineBridge(room, socket.data.userId)
    );
  });
};
