import {
  decodeDeadLetterEntry,
  getRedisDeadLetterKey,
  getRedisQueueKey,
  parseLimit,
} from './jobRunner.shared';
import { jobRunnerState } from './jobRunner.state';
import type { GameJobDeadLetterEntry } from './jobRunner.types';
import { getRedisCommandClient, isRedisEnabled } from './redis';

export const getQueueCounts = async (): Promise<{
  delayedCount: number;
  deadLetterCount: number;
}> => {
  const redis = getRedisCommandClient();
  let delayedCount = 0;
  let deadLetterCount = 0;

  if (isRedisEnabled()) {
    if (!redis) {
      console.error('Redis job client is not available while Redis mode is enabled.');
    } else {
      try {
        const [delayed, dead] = await Promise.all([
          redis.zCard(getRedisQueueKey()),
          redis.lLen(getRedisDeadLetterKey()),
        ]);
        delayedCount = delayed;
        deadLetterCount = dead;
      } catch (error) {
        console.error('Failed to read Redis job queue status:', error);
      }
    }
  } else {
    delayedCount = jobRunnerState.localQueue.length;
    deadLetterCount = jobRunnerState.localDeadLetters.length;
  }

  return { delayedCount, deadLetterCount };
};

export const listDeadLetters = async (limit = 50): Promise<GameJobDeadLetterEntry[]> => {
  const safeLimit = parseLimit(limit);
  const redis = getRedisCommandClient();

  if (isRedisEnabled()) {
    if (!redis) {
      console.error('Redis dead-letter client is not available while Redis mode is enabled.');
      return [];
    }

    try {
      const rows = await redis.lRange(getRedisDeadLetterKey(), 0, safeLimit - 1);
      return rows
        .map((row) => decodeDeadLetterEntry(row))
        .filter((entry): entry is GameJobDeadLetterEntry => entry !== null);
    } catch (error) {
      console.error('Failed to list Redis dead-letter jobs:', error);
      return [];
    }
  }

  return jobRunnerState.localDeadLetters.slice(0, safeLimit);
};

export const clearQueues = async (options?: {
  delayed?: boolean;
  deadLetter?: boolean;
}): Promise<void> => {
  const clearDelayed = options?.delayed ?? true;
  const clearDeadLetter = options?.deadLetter ?? true;

  if (clearDelayed) {
    jobRunnerState.localQueue.length = 0;
    jobRunnerState.localDedupe.clear();
  }
  if (clearDeadLetter) {
    jobRunnerState.localDeadLetters.length = 0;
  }

  if (!isRedisEnabled()) {
    return;
  }

  const redis = getRedisCommandClient();
  if (!redis) {
    return;
  }

  const keysToDelete: string[] = [];
  if (clearDelayed) keysToDelete.push(getRedisQueueKey());
  if (clearDeadLetter) keysToDelete.push(getRedisDeadLetterKey());
  if (keysToDelete.length === 0) {
    return;
  }

  try {
    await redis.del(keysToDelete);
  } catch (error) {
    console.error('Failed to clear Redis game job queues:', error);
  }
};
