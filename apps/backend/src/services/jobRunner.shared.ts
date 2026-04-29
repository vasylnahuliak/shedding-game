import { randomUUID } from 'crypto';

import { toPositiveInt } from '@/utils/numbers';

import type {
  GameJobDeadLetterEntry,
  GameJobName,
  RetryStrategy,
  ScheduleGameJobOptions,
  StoredGameJob,
} from './jobRunner.types';
import { getRedisKeyPrefix } from './redis';

const JOB_POLL_INTERVAL_MS_DEFAULT = 200;
const JOB_BATCH_SIZE_DEFAULT = 20;
const JOB_DEDUPE_MIN_TTL_MS = 1000;
const JOB_DEDUPE_GRACE_MS = 2000;
const JOB_MAX_ATTEMPTS_DEFAULT = 3;
const JOB_RETRY_INITIAL_BACKOFF_MS_DEFAULT = 1000;
const JOB_RETRY_MAX_BACKOFF_MS_DEFAULT = 30_000;
const JOB_DEAD_LETTER_MAX_SIZE_DEFAULT = 1000;

export const POP_DUE_REDIS_JOB_SCRIPT = `
  local queue = KEYS[1]
  local now = ARGV[1]
  local jobs = redis.call("ZRANGEBYSCORE", queue, "-inf", now, "LIMIT", 0, 1)
  if #jobs == 0 then
    return nil
  end
  local job = jobs[1]
  if redis.call("ZREM", queue, job) == 1 then
    return job
  end
  return nil
`;

export const getPollIntervalMs = (): number =>
  toPositiveInt(process.env.REDIS_JOB_POLL_INTERVAL_MS, JOB_POLL_INTERVAL_MS_DEFAULT);

export const getBatchSize = (): number =>
  toPositiveInt(process.env.REDIS_JOB_BATCH_SIZE, JOB_BATCH_SIZE_DEFAULT);

export const getDeadLetterMaxSize = (): number =>
  toPositiveInt(process.env.REDIS_JOB_DEAD_LETTER_MAX_SIZE, JOB_DEAD_LETTER_MAX_SIZE_DEFAULT);

const getDefaultRetryStrategy = (): RetryStrategy => {
  const maxAttempts = Math.max(
    1,
    toPositiveInt(process.env.REDIS_JOB_MAX_ATTEMPTS, JOB_MAX_ATTEMPTS_DEFAULT)
  );
  const initialBackoffMs = toPositiveInt(
    process.env.REDIS_JOB_RETRY_INITIAL_BACKOFF_MS,
    JOB_RETRY_INITIAL_BACKOFF_MS_DEFAULT
  );
  const maxBackoffMs = Math.max(
    initialBackoffMs,
    toPositiveInt(process.env.REDIS_JOB_RETRY_MAX_BACKOFF_MS, JOB_RETRY_MAX_BACKOFF_MS_DEFAULT)
  );

  return { maxAttempts, initialBackoffMs, maxBackoffMs };
};

const isGameJobName = (value: unknown): value is GameJobName =>
  value === 'bot_turn' ||
  value === 'round_deal' ||
  value === 'stale_cleanup' ||
  value === 'turn_timeout';

const getRetryStrategy = (options: ScheduleGameJobOptions): RetryStrategy => {
  const defaults = getDefaultRetryStrategy();
  const maxAttempts = Math.max(1, options.maxAttempts ?? defaults.maxAttempts);
  const initialBackoffMs = Math.max(1, options.initialBackoffMs ?? defaults.initialBackoffMs);
  const maxBackoffMs = Math.max(initialBackoffMs, options.maxBackoffMs ?? defaults.maxBackoffMs);

  return { maxAttempts, initialBackoffMs, maxBackoffMs };
};

export const getRedisQueueKey = (): string => `${getRedisKeyPrefix()}:jobs:delayed`;
export const getRedisDeadLetterKey = (): string => `${getRedisKeyPrefix()}:jobs:dead-letter`;
export const getRedisDedupeKey = (dedupeKey: string): string =>
  `${getRedisKeyPrefix()}:job-dedupe:${dedupeKey}`;

export const getDedupeTtlMs = (options: ScheduleGameJobOptions): number =>
  Math.max(
    JOB_DEDUPE_MIN_TTL_MS,
    options.dedupeTtlMs ?? Math.max(0, Math.floor(options.delayMs)) + JOB_DEDUPE_GRACE_MS
  );

export const encodeJob = (job: StoredGameJob): string => JSON.stringify(job);

export const decodeStoredJob = (raw: string): StoredGameJob | null => {
  try {
    const parsed = JSON.parse(raw) as StoredGameJob;
    if (!parsed || typeof parsed !== 'object') return null;
    if (!isGameJobName(parsed.name)) return null;
    if (typeof parsed.runAt !== 'number') return null;
    if (!parsed.payload || typeof parsed.payload !== 'object') return null;
    if (parsed.dedupeKey !== undefined && typeof parsed.dedupeKey !== 'string') return null;
    if (
      parsed.dedupeTtlMs !== undefined &&
      (typeof parsed.dedupeTtlMs !== 'number' || parsed.dedupeTtlMs < 1)
    ) {
      return null;
    }
    if (typeof parsed.attempt !== 'number' || parsed.attempt < 1) return null;
    if (typeof parsed.maxAttempts !== 'number' || parsed.maxAttempts < 1) return null;
    if (typeof parsed.initialBackoffMs !== 'number' || parsed.initialBackoffMs < 1) return null;
    if (typeof parsed.maxBackoffMs !== 'number' || parsed.maxBackoffMs < parsed.initialBackoffMs) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const decodeDeadLetterEntry = (raw: string): GameJobDeadLetterEntry | null => {
  try {
    const parsed = JSON.parse(raw) as GameJobDeadLetterEntry;
    if (!parsed || typeof parsed !== 'object') return null;
    if (!isGameJobName(parsed.name)) return null;
    if (!parsed.payload || typeof parsed.payload !== 'object') return null;
    if (typeof parsed.error !== 'string') return null;
    if (typeof parsed.failedAt !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
};

export const createStoredJob = <Name extends GameJobName>(
  name: Name,
  payload: StoredGameJob<Name>['payload'],
  options: ScheduleGameJobOptions
): StoredGameJob<Name> => {
  const retry = getRetryStrategy(options);

  return {
    id: randomUUID(),
    name,
    payload,
    runAt: Date.now() + Math.max(0, Math.floor(options.delayMs)),
    dedupeKey: options.dedupeKey,
    dedupeTtlMs: options.dedupeTtlMs,
    attempt: 1,
    maxAttempts: retry.maxAttempts,
    initialBackoffMs: retry.initialBackoffMs,
    maxBackoffMs: retry.maxBackoffMs,
  };
};

export const getJobDedupeOptions = (
  job: StoredGameJob
): Pick<ScheduleGameJobOptions, 'dedupeKey' | 'dedupeTtlMs' | 'delayMs'> | null => {
  if (!job.dedupeKey) {
    return null;
  }

  return {
    delayMs: Math.max(0, job.runAt - Date.now()),
    dedupeKey: job.dedupeKey,
    dedupeTtlMs: job.dedupeTtlMs,
  };
};

export const getRetryDelayMs = (job: StoredGameJob): number => {
  const exponent = Math.max(0, job.attempt - 1);
  const baseDelay = Math.min(job.maxBackoffMs, job.initialBackoffMs * 2 ** exponent);
  return Math.max(1, Math.floor(baseDelay));
};

export const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.stack || error.message;
  }
  if (typeof error === 'string') {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
};

export const parseLimit = (limit: number): number => Math.max(1, Math.min(500, Math.floor(limit)));
