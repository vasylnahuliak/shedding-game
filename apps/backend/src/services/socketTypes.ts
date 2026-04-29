import type {
  AppLocale,
  BackendMessageCode,
  BackendMessageParamsByCode,
} from '@shedding-game/shared';
import type { RateLimiterAbstract } from 'rate-limiter-flexible';
import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import type { DefaultEventsMap, Server, Socket } from 'socket.io';

import { getRedisCommandClient, getRedisKeyPrefix } from '@/services/redis';
import type { Room } from '@/types';

export interface SocketData {
  userId: string;
  locale: AppLocale;
}

export type AppSocketServer = Server<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  SocketData
>;
export type AppSocket = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>;
type SocketHandshakeAuth = {
  token?: string;
  locale?: string;
};

export type MessageParams<Code extends BackendMessageCode> = Exclude<
  BackendMessageParamsByCode[Code],
  undefined
>;

export type LockedRoomMutationResult = {
  room: Room;
  deadlockResolved: boolean;
};

const SOCKET_RATE_LIMITS: Record<string, { points: number; duration: number }> = {
  join_room: { points: 10, duration: 10 },
  make_move: { points: 15, duration: 1 },
  draw_card: { points: 10, duration: 1 },
  pass_turn: { points: 10, duration: 1 },
  apply_bridge: { points: 10, duration: 1 },
  decline_bridge: { points: 10, duration: 1 },
  emoji_reaction: { points: 10, duration: 3 },
  delete_room: { points: 5, duration: 10 },
  end_game: { points: 5, duration: 10 },
  recreate_room: { points: 5, duration: 10 },
  player_leave_game: { points: 5, duration: 10 },
  player_ready_next_round: { points: 10, duration: 5 },
  leave_room: { points: 5, duration: 10 },
  set_locale: { points: 5, duration: 10 },
};

export const createSocketRateLimiters = (): Map<string, RateLimiterAbstract> => {
  const redisClient = getRedisCommandClient();
  const keyPrefix = getRedisKeyPrefix();
  const limiters = new Map<string, RateLimiterAbstract>();

  for (const [event, config] of Object.entries(SOCKET_RATE_LIMITS)) {
    const memoryFallback = new RateLimiterMemory({
      keyPrefix: `rl:${event}`,
      ...config,
    });

    limiters.set(
      event,
      redisClient
        ? new RateLimiterRedis({
            storeClient: redisClient,
            keyPrefix: `${keyPrefix}:rl:${event}`,
            ...config,
            insuranceLimiter: memoryFallback,
          })
        : memoryFallback
    );
  }

  return limiters;
};

export const getHeaderLocaleValue = (value: string | string[] | undefined): string | undefined => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
};

export const isSocketHandshakeAuth = (value: unknown): value is SocketHandshakeAuth =>
  typeof value === 'object' && value !== null;
