export type GameJobName = 'bot_turn' | 'round_deal' | 'stale_cleanup' | 'turn_timeout';

export type GameJobPayloadMap = {
  bot_turn: { roomId: string };
  round_deal: { roomId: string };
  stale_cleanup: Record<string, never>;
  turn_timeout: { roomId: string; playerId: string; turnStartedAt: number };
};

export type GameJobHandlers = {
  [Name in GameJobName]: (payload: GameJobPayloadMap[Name]) => Promise<void>;
};

export type StoredGameJob<Name extends GameJobName = GameJobName> = {
  id: string;
  name: Name;
  payload: GameJobPayloadMap[Name];
  runAt: number;
  dedupeKey?: string;
  dedupeTtlMs?: number;
  attempt: number;
  maxAttempts: number;
  initialBackoffMs: number;
  maxBackoffMs: number;
};

export type GameJobDeadLetterEntry<Name extends GameJobName = GameJobName> = {
  id: string;
  name: Name;
  payload: GameJobPayloadMap[Name];
  runAt: number;
  failedAt: number;
  attempt: number;
  maxAttempts: number;
  error: string;
};

export type ScheduleGameJobOptions = {
  delayMs: number;
  dedupeKey?: string;
  dedupeTtlMs?: number;
  maxAttempts?: number;
  initialBackoffMs?: number;
  maxBackoffMs?: number;
};

export type RetryStrategy = {
  maxAttempts: number;
  initialBackoffMs: number;
  maxBackoffMs: number;
};

export type GameJobQueueStatus = {
  redisEnabled: boolean;
  workerRunning: boolean;
  pollInProgress: boolean;
  delayedCount: number;
  deadLetterCount: number;
  localDelayedCount: number;
  localDeadLetterCount: number;
};
