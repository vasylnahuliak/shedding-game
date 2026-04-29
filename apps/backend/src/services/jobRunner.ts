import { clearQueues, getQueueCounts, listDeadLetters } from './jobRunner.admin';
import { createStoredJob, getBatchSize, getPollIntervalMs } from './jobRunner.shared';
import { jobRunnerState } from './jobRunner.state';
import { enqueueJob, handleFailedJob, popDueJob } from './jobRunner.store';
import type {
  GameJobHandlers,
  GameJobName,
  GameJobPayloadMap,
  GameJobQueueStatus,
  ScheduleGameJobOptions,
} from './jobRunner.types';
import { isRedisEnabled } from './redis';

export type { GameJobHandlers } from './jobRunner.types';

const runDueJobs = async (): Promise<void> => {
  if (jobRunnerState.pollInProgress || !jobRunnerState.handlers) {
    return;
  }

  jobRunnerState.pollInProgress = true;

  try {
    const maxJobs = getBatchSize();
    for (let processed = 0; processed < maxJobs; processed++) {
      const job = await popDueJob();
      if (!job) {
        return;
      }

      const handler = jobRunnerState.handlers[job.name];
      if (!handler) {
        await handleFailedJob(job, new Error(`Missing handler for job "${job.name}"`));
        continue;
      }

      try {
        await handler(job.payload as never);
      } catch (error) {
        console.error(`Game job "${job.name}" failed:`, error);
        await handleFailedJob(job, error);
      }
    }
  } finally {
    jobRunnerState.pollInProgress = false;
  }
};

export const startGameJobWorker = (jobHandlers: GameJobHandlers): void => {
  jobRunnerState.handlers = jobHandlers;
  if (jobRunnerState.pollTimer) {
    return;
  }

  jobRunnerState.pollTimer = setInterval(() => {
    void runDueJobs();
  }, getPollIntervalMs());
  jobRunnerState.pollTimer.unref?.();
};

export const stopGameJobWorker = (): void => {
  if (jobRunnerState.pollTimer) {
    clearInterval(jobRunnerState.pollTimer);
    jobRunnerState.pollTimer = null;
  }

  jobRunnerState.pollInProgress = false;
  jobRunnerState.handlers = null;
  jobRunnerState.localQueue.length = 0;
  jobRunnerState.localDedupe.clear();
  jobRunnerState.localDeadLetters.length = 0;
};

export const scheduleGameJob = async <Name extends GameJobName>(
  name: Name,
  payload: GameJobPayloadMap[Name],
  options: ScheduleGameJobOptions
): Promise<boolean> => enqueueJob(createStoredJob(name, payload, options));

export const getGameJobQueueStatus = async (): Promise<GameJobQueueStatus> => {
  const { delayedCount, deadLetterCount } = await getQueueCounts();

  return {
    redisEnabled: isRedisEnabled(),
    workerRunning: jobRunnerState.pollTimer !== null && jobRunnerState.handlers !== null,
    pollInProgress: jobRunnerState.pollInProgress,
    delayedCount,
    deadLetterCount,
    localDelayedCount: jobRunnerState.localQueue.length,
    localDeadLetterCount: jobRunnerState.localDeadLetters.length,
  };
};

export const listGameJobDeadLetters = async (limit = 50) => listDeadLetters(limit);

export const clearGameJobQueues = async (options?: {
  delayed?: boolean;
  deadLetter?: boolean;
}): Promise<void> => {
  await clearQueues(options);
};
