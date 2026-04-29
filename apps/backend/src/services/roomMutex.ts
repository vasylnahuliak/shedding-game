import { randomUUID } from 'crypto';

import { toPositiveInt } from '@/utils/numbers';

import { getRedisCommandClient, getRedisKeyPrefix, isRedisEnabled } from './redis';

const roomLocks = new Map<string, Promise<void>>();
const userLocks = new Map<string, Promise<void>>();

const REDIS_LOCK_TTL_MS_DEFAULT = 15_000;
const REDIS_LOCK_EXTEND_INTERVAL_MS_DEFAULT = 5_000;
const REDIS_LOCK_RETRY_MIN_MS = 25;
const REDIS_LOCK_RETRY_MAX_MS = 75;

const EXTEND_LOCK_SCRIPT = `
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("pexpire", KEYS[1], ARGV[2])
  end
  return 0
`;

const RELEASE_LOCK_SCRIPT = `
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
  end
  return 0
`;

const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

const getRedisLockTtlMs = (): number =>
  toPositiveInt(process.env.REDIS_LOCK_TTL_MS, REDIS_LOCK_TTL_MS_DEFAULT);

const getRedisLockExtendIntervalMs = (ttlMs: number): number => {
  const configured = toPositiveInt(
    process.env.REDIS_LOCK_EXTEND_INTERVAL_MS,
    REDIS_LOCK_EXTEND_INTERVAL_MS_DEFAULT
  );
  if (configured >= ttlMs) {
    return Math.max(1000, Math.floor(ttlMs / 2));
  }
  return configured;
};

const withLocalLock = async <T>(
  locks: Map<string, Promise<void>>,
  key: string,
  task: () => Promise<T>
): Promise<T> => {
  const previousLock = locks.get(key) ?? Promise.resolve();

  let releaseLock!: () => void;
  const currentLock = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });

  locks.set(
    key,
    previousLock.then(
      () => currentLock,
      () => currentLock
    )
  );

  await previousLock;

  try {
    return await task();
  } finally {
    releaseLock();
    if (locks.get(key) === currentLock) {
      locks.delete(key);
    }
  }
};

const withRedisLock = async <T>(lockKeyPath: string, task: () => Promise<T>): Promise<T> => {
  const redis = getRedisCommandClient();
  if (!redis) {
    throw new Error('Redis command client is not available while Redis mode is enabled.');
  }

  const lockKey = `${getRedisKeyPrefix()}:lock:${lockKeyPath}`;
  const lockToken = randomUUID();
  const lockTtlMs = getRedisLockTtlMs();
  const lockExtendIntervalMs = getRedisLockExtendIntervalMs(lockTtlMs);

  while (true) {
    const acquired = await redis.set(lockKey, lockToken, { NX: true, PX: lockTtlMs });
    if (acquired === 'OK') {
      break;
    }

    const retryDelayMs =
      REDIS_LOCK_RETRY_MIN_MS +
      Math.floor(Math.random() * (REDIS_LOCK_RETRY_MAX_MS - REDIS_LOCK_RETRY_MIN_MS + 1));
    await sleep(retryDelayMs);
  }

  const extensionTimer = setInterval(() => {
    void redis
      .eval(EXTEND_LOCK_SCRIPT, {
        keys: [lockKey],
        arguments: [lockToken, String(lockTtlMs)],
      })
      .catch((error: unknown) => {
        console.error(`Failed to extend Redis lock "${lockKeyPath}":`, error);
      });
  }, lockExtendIntervalMs);
  extensionTimer.unref?.();

  try {
    return await task();
  } finally {
    clearInterval(extensionTimer);

    try {
      await redis.eval(RELEASE_LOCK_SCRIPT, {
        keys: [lockKey],
        arguments: [lockToken],
      });
    } catch (error) {
      console.error(`Failed to release Redis lock "${lockKeyPath}":`, error);
    }
  }
};

export const withRoomLock = async <T>(roomId: string, task: () => Promise<T>): Promise<T> => {
  if (!isRedisEnabled()) {
    return withLocalLock(roomLocks, roomId, task);
  }

  return withRedisLock(`room:${roomId}`, task);
};

export const withUserLock = async <T>(userId: string, task: () => Promise<T>): Promise<T> => {
  if (!isRedisEnabled()) {
    return withLocalLock(userLocks, userId, task);
  }

  return withRedisLock(`user:${userId}`, task);
};
