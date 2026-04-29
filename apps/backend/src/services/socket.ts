import { resolveAppLocale } from '@shedding-game/shared';

import { resolveAuthIdentity } from './authIdentity';
import { startGameJobWorker } from './jobRunner';
import { getRoomsList } from './room';
import { captureBackendException } from './sentry';
import {
  broadcastPlayerKicked,
  broadcastRoomClosed,
  broadcastRoomNotice,
  broadcastRooms,
  broadcastRoomUpdate,
  disconnectUserSockets,
} from './socketBroadcasts';
import { createSocketConnectionHelpers } from './socketConnectionHelpers';
import { emitServerSocketEvent } from './socketEvents';
import { registerSocketGameHandlers } from './socketGameHandlers';
import { createSocketJobHandlers, scheduleStaleCleanupTick } from './socketJobs';
import { registerSocketRoomHandlers } from './socketRoomHandlers';
import { setSocketServer } from './socketRuntime';
import type { AppSocket, AppSocketServer } from './socketTypes';
import {
  createSocketRateLimiters,
  getHeaderLocaleValue,
  isSocketHandshakeAuth,
} from './socketTypes';

export type { AppSocketServer, SocketData } from './socketTypes';

export const initSocket = (socketServer: AppSocketServer) => {
  setSocketServer(socketServer);

  const socketRateLimiters = createSocketRateLimiters();
  const consumeRateLimit = async (socket: AppSocket, event: string): Promise<boolean> => {
    const limiter = socketRateLimiters.get(event);
    if (!limiter) {
      return true;
    }

    try {
      await limiter.consume(socket.data.userId);
      return true;
    } catch {
      return false;
    }
  };

  startGameJobWorker(createSocketJobHandlers());
  void scheduleStaleCleanupTick();

  socketServer.use((socket: AppSocket, next) => {
    void (async () => {
      try {
        const handshakeAuth = isSocketHandshakeAuth(socket.handshake.auth)
          ? socket.handshake.auth
          : undefined;
        const token = handshakeAuth?.token;
        const identity = token ? await resolveAuthIdentity(token) : null;
        if (!identity) {
          next(new Error('Unauthorized'));
          return;
        }

        socket.data.userId = identity.userId;
        socket.data.locale = resolveAppLocale(
          handshakeAuth?.locale ?? getHeaderLocaleValue(socket.handshake.headers['accept-language'])
        );
        next();
      } catch (error) {
        captureBackendException(error, {
          user: socket.data.userId ? { id: socket.data.userId } : undefined,
          tags: { operation: 'socket.authenticate' },
          extra: { socketId: socket.id },
        });
        next(error instanceof Error ? error : new Error('Socket authentication failed.'));
      }
    })();
  });

  socketServer.on('connection', (socket: AppSocket) => {
    void (async () => {
      emitServerSocketEvent(socket, 'rooms_updated', {
        rooms: await getRoomsList(socket.data.userId),
      });
    })();

    const helpers = createSocketConnectionHelpers(socket);
    const canConsumeEvent = (event: string) => consumeRateLimit(socket, event);

    registerSocketRoomHandlers({ socket, canConsumeEvent, helpers });
    registerSocketGameHandlers({ socket, canConsumeEvent, helpers });
  });
};

export {
  broadcastPlayerKicked,
  broadcastRoomClosed,
  broadcastRoomNotice,
  broadcastRooms,
  broadcastRoomUpdate,
  disconnectUserSockets,
};
