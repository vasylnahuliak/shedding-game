import { randomUUID } from 'crypto';

import {
  decodeStoredJob,
  encodeJob,
  getDeadLetterMaxSize,
  getDedupeTtlMs,
  getJobDedupeOptions,
  getRedisDeadLetterKey,
  getRedisDedupeKey,
  getRedisQueueKey,
  getRetryDelayMs,
  POP_DUE_REDIS_JOB_SCRIPT,
  toErrorMessage,
} from './jobRunner.shared';
import { jobRunnerState } from './jobRunner.state';
import type { GameJobDeadLetterEntry, StoredGameJob } from './jobRunner.types';
import { getRedisCommandClient, isRedisEnabled } from './redis';
import { captureBackendException } from './sentry';

const cleanupLocalDedupe = (): void => {
  const now = Date.now();
  for (const [key, expiresAt] of jobRunnerState.localDedupe.entries()) {
    if (expiresAt <= now) {
      jobRunnerState.localDedupe.delete(key);
    }
  }
};

const pushLocalDeadLetter = (entry: GameJobDeadLetterEntry): void => {
  jobRunnerState.localDeadLetters.unshift(entry);
  const maxSize = getDeadLetterMaxSize();
  if (jobRunnerState.localDeadLetters.length > maxSize) {
    jobRunnerState.localDeadLetters.length = maxSize;
  }
};

const pushRedisDeadLetter = async (entry: GameJobDeadLetterEntry): Promise<void> => {
  const redis = getRedisCommandClient();
  if (!redis) {
    console.error('Redis dead-letter client is not available while Redis mode is enabled.');
    return;
  }

  const maxSize = getDeadLetterMaxSize();

  try {
    await redis
      .multi()
      .lPush(getRedisDeadLetterKey(), JSON.stringify(entry))
      .lTrim(getRedisDeadLetterKey(), 0, maxSize - 1)
      .exec();
  } catch (error) {
    console.error('Failed to push dead-letter entry to Redis:', error);
  }
};

const queueDeadLetter = async (entry: GameJobDeadLetterEntry): Promise<void> => {
  if (isRedisEnabled()) {
    await pushRedisDeadLetter(entry);
    return;
  }

  pushLocalDeadLetter(entry);
};

const releaseLocalDedupe = (dedupeKey?: string): void => {
  if (!dedupeKey) {
    return;
  }

  jobRunnerState.localDedupe.delete(dedupeKey);
};

const releaseRedisDedupe = async (dedupeKey?: string): Promise<void> => {
  if (!dedupeKey) {
    return;
  }

  const redis = getRedisCommandClient();
  if (!redis) {
    console.error('Redis job client is not available while Redis mode is enabled.');
    return;
  }

  try {
    await redis.del(getRedisDedupeKey(dedupeKey));
  } catch (error) {
    console.error(`Failed to release Redis dedupe key "${dedupeKey}":`, error);
  }
};

const enqueueLocalJob = async (job: StoredGameJob): Promise<boolean> => {
  cleanupLocalDedupe();
  const dedupeOptions = getJobDedupeOptions(job);

  if (dedupeOptions?.dedupeKey) {
    const expiresAt = jobRunnerState.localDedupe.get(dedupeOptions.dedupeKey);
    if (expiresAt && expiresAt > Date.now()) {
      return false;
    }

    jobRunnerState.localDedupe.set(
      dedupeOptions.dedupeKey,
      Date.now() +
        getDedupeTtlMs({
          delayMs: dedupeOptions.delayMs ?? Math.max(0, job.runAt - Date.now()),
          dedupeKey: dedupeOptions.dedupeKey,
          dedupeTtlMs: dedupeOptions.dedupeTtlMs,
        })
    );
  }

  jobRunnerState.localQueue.push(job);
  return true;
};

const enqueueRedisJob = async (job: StoredGameJob): Promise<boolean> => {
  const redis = getRedisCommandClient();
  if (!redis) {
    console.error(
      `Redis job client is not available for "${job.name}" while Redis mode is enabled.`
    );
    return false;
  }

  const dedupeOptions = getJobDedupeOptions(job);
  let dedupeRedisKey: string | null = null;

  try {
    if (dedupeOptions?.dedupeKey) {
      dedupeRedisKey = getRedisDedupeKey(dedupeOptions.dedupeKey);
      const acquired = await redis.set(dedupeRedisKey, randomUUID(), {
        NX: true,
        PX: getDedupeTtlMs({
          delayMs: dedupeOptions.delayMs ?? Math.max(0, job.runAt - Date.now()),
          dedupeKey: dedupeOptions.dedupeKey,
          dedupeTtlMs: dedupeOptions.dedupeTtlMs,
        }),
      });

      if (acquired !== 'OK') {
        return false;
      }
    }

    await redis.zAdd(getRedisQueueKey(), [{ score: job.runAt, value: encodeJob(job) }]);
    return true;
  } catch (error) {
    console.error(`Failed to enqueue Redis job "${job.name}":`, error);

    if (dedupeRedisKey) {
      try {
        await redis.del(dedupeRedisKey);
      } catch (deleteError) {
        console.error(`Failed to rollback Redis dedupe key "${dedupeRedisKey}":`, deleteError);
      }
    }

    return false;
  }
};

export const enqueueJob = async (job: StoredGameJob): Promise<boolean> => {
  if (isRedisEnabled()) {
    return enqueueRedisJob(job);
  }

  return enqueueLocalJob(job);
};

const popDueLocalJob = async (): Promise<StoredGameJob | null> => {
  const now = Date.now();
  let candidateIndex = -1;
  let candidateRunAt = Number.MAX_SAFE_INTEGER;

  for (let index = 0; index < jobRunnerState.localQueue.length; index++) {
    const job = jobRunnerState.localQueue[index];
    if (job.runAt > now) continue;
    if (job.runAt < candidateRunAt) {
      candidateRunAt = job.runAt;
      candidateIndex = index;
    }
  }

  if (candidateIndex === -1) return null;

  const [job] = jobRunnerState.localQueue.splice(candidateIndex, 1);
  releaseLocalDedupe(job?.dedupeKey);
  return job ?? null;
};

const popDueRedisJob = async (): Promise<StoredGameJob | null> => {
  const redis = getRedisCommandClient();
  if (!redis) {
    console.error('Redis job client is not available while Redis mode is enabled.');
    return null;
  }

  try {
    const raw = await redis.eval(POP_DUE_REDIS_JOB_SCRIPT, {
      keys: [getRedisQueueKey()],
      arguments: [String(Date.now())],
    });

    if (typeof raw !== 'string') {
      return null;
    }

    const job = decodeStoredJob(raw);
    if (job) {
      await releaseRedisDedupe(job.dedupeKey);
    }

    return job;
  } catch (error) {
    console.error('Failed to pop due Redis game job:', error);
    return null;
  }
};

export const popDueJob = async (): Promise<StoredGameJob | null> => {
  if (isRedisEnabled()) {
    return popDueRedisJob();
  }

  return popDueLocalJob();
};

export const handleFailedJob = async (job: StoredGameJob, error: unknown): Promise<void> => {
  const errorMessage = toErrorMessage(error);

  if (job.attempt < job.maxAttempts) {
    await enqueueJob({
      ...job,
      attempt: job.attempt + 1,
      runAt: Date.now() + getRetryDelayMs(job),
    });
    return;
  }

  captureBackendException(error, {
    tags: { operation: 'game_job.final_failure', jobName: job.name },
    extra: {
      jobId: job.id,
      runAt: job.runAt,
      attempt: job.attempt,
      maxAttempts: job.maxAttempts,
      payload: job.payload,
    },
  });

  await queueDeadLetter({
    id: job.id,
    name: job.name,
    payload: job.payload,
    runAt: job.runAt,
    failedAt: Date.now(),
    attempt: job.attempt,
    maxAttempts: job.maxAttempts,
    error: errorMessage,
  });
};
