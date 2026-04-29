import type { GameJobDeadLetterEntry, GameJobHandlers, StoredGameJob } from './jobRunner.types';

export const jobRunnerState: {
  pollTimer: NodeJS.Timeout | null;
  pollInProgress: boolean;
  handlers: GameJobHandlers | null;
  localQueue: StoredGameJob[];
  localDedupe: Map<string, number>;
  localDeadLetters: GameJobDeadLetterEntry[];
} = {
  pollTimer: null,
  pollInProgress: false,
  handlers: null,
  localQueue: [],
  localDedupe: new Map<string, number>(),
  localDeadLetters: [],
};
