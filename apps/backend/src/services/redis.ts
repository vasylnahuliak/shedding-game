import { createClient } from 'redis';

import { captureBackendException } from './sentry';

type RedisClient = ReturnType<typeof createClient>;

type RedisAdapterClients = {
  pub: RedisClient;
  sub: RedisClient;
};

type RedisRuntime =
  | { enabled: false }
  | {
      enabled: true;
      adapterClients: RedisAdapterClients;
      commandClient: RedisClient;
    };

const REDIS_KEY_PREFIX_DEFAULT = 'sg';

let runtime: RedisRuntime = { enabled: false };
let initialized = false;

const getRedisUrl = (): string => process.env.REDIS_URL?.trim() ?? '';

const attachRedisErrorLogging = (client: RedisClient, label: string) => {
  client.on('error', (error) => {
    console.error(`Redis ${label} client error:`, error);
  });
};

const closeRedisClient = async (client: RedisClient): Promise<void> => {
  if (!client.isOpen) return;

  try {
    await client.quit();
  } catch {
    client.destroy();
  }
};

export const getRedisKeyPrefix = (): string => {
  const configured = process.env.REDIS_KEY_PREFIX?.trim();
  return configured || REDIS_KEY_PREFIX_DEFAULT;
};

export const initRedisInfra = async (): Promise<void> => {
  if (initialized) return;
  initialized = true;

  const redisUrl = getRedisUrl();
  if (!redisUrl) {
    console.warn('REDIS_URL is not set. Running backend in single-instance mode without Redis.');
    runtime = { enabled: false };
    return;
  }

  const pub = createClient({ url: redisUrl });
  const sub = pub.duplicate();
  const cmd = pub.duplicate();

  attachRedisErrorLogging(pub, 'pub');
  attachRedisErrorLogging(sub, 'sub');
  attachRedisErrorLogging(cmd, 'cmd');

  try {
    await Promise.all([pub.connect(), sub.connect(), cmd.connect()]);
    runtime = {
      enabled: true,
      adapterClients: { pub, sub },
      commandClient: cmd,
    };
    console.log('Redis infrastructure initialized.');
  } catch (error) {
    await Promise.allSettled([closeRedisClient(pub), closeRedisClient(sub), closeRedisClient(cmd)]);
    runtime = { enabled: false };
    initialized = false;
    console.error('Failed to connect Redis clients:', error);
    captureBackendException(error, {
      tags: { operation: 'redis.init' },
      extra: { redisConfigured: true },
    });
    throw new Error('Failed to connect Redis. Check REDIS_URL and Redis availability.');
  }
};

export const shutdownRedisInfra = async (): Promise<void> => {
  if (!initialized) return;

  const clients: RedisClient[] = runtime.enabled
    ? [runtime.adapterClients.pub, runtime.adapterClients.sub, runtime.commandClient]
    : [];

  await Promise.allSettled(clients.map((client) => closeRedisClient(client)));

  runtime = { enabled: false };
  initialized = false;
};

export const isRedisEnabled = (): boolean => runtime.enabled;

export const getRedisAdapterClients = (): RedisAdapterClients | null =>
  runtime.enabled ? runtime.adapterClients : null;

export const getRedisCommandClient = (): RedisClient | null =>
  runtime.enabled ? runtime.commandClient : null;
