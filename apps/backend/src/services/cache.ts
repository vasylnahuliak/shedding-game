import { toPositiveInt } from '@/utils/numbers';

import { getRedisCommandClient, getRedisKeyPrefix, isRedisEnabled } from './redis';

type CacheNamespace = 'rooms' | 'stats';

const DEFAULT_NAMESPACE_VERSION = 1;
const localNamespaceVersions = new Map<CacheNamespace, number>();

const getNamespaceVersionKey = (namespace: CacheNamespace): string =>
  `${getRedisKeyPrefix()}:cache:version:${namespace}`;

const getEntryKey = (namespace: CacheNamespace, version: number, key: string): string =>
  `${getRedisKeyPrefix()}:cache:${namespace}:v${version}:${key}`;

const getLocalNamespaceVersion = (namespace: CacheNamespace): number => {
  const version = localNamespaceVersions.get(namespace) ?? DEFAULT_NAMESPACE_VERSION;
  localNamespaceVersions.set(namespace, version);
  return version;
};

const getNamespaceVersion = async (namespace: CacheNamespace): Promise<number> => {
  if (!isRedisEnabled()) {
    return getLocalNamespaceVersion(namespace);
  }

  const redis = getRedisCommandClient();
  if (!redis) {
    return getLocalNamespaceVersion(namespace);
  }

  const key = getNamespaceVersionKey(namespace);

  try {
    const existing = await redis.get(key);
    if (existing) {
      const parsed = Number(existing);
      return Number.isFinite(parsed) && parsed >= DEFAULT_NAMESPACE_VERSION
        ? Math.floor(parsed)
        : DEFAULT_NAMESPACE_VERSION;
    }

    await redis.set(key, String(DEFAULT_NAMESPACE_VERSION), { NX: true });
    return DEFAULT_NAMESPACE_VERSION;
  } catch (error) {
    console.error(`Failed to read cache namespace version "${namespace}":`, error);
    return DEFAULT_NAMESPACE_VERSION;
  }
};

export const getCacheTtlMs = (envName: string, fallback: number): number =>
  toPositiveInt(process.env[envName], fallback);

export const getOrSetNamespacedCache = async <T>(
  namespace: CacheNamespace,
  key: string,
  ttlMs: number,
  load: () => Promise<T>
): Promise<T> => {
  if (!isRedisEnabled()) {
    return load();
  }

  const redis = getRedisCommandClient();
  if (!redis) {
    return load();
  }

  const version = await getNamespaceVersion(namespace);
  const entryKey = getEntryKey(namespace, version, key);

  try {
    const cachedRaw = await redis.get(entryKey);
    if (cachedRaw !== null) {
      const parsed = JSON.parse(cachedRaw) as { value: T };
      return parsed.value;
    }
  } catch (error) {
    console.error(`Failed to read cache entry "${entryKey}":`, error);
  }

  const value = await load();

  try {
    await redis.set(entryKey, JSON.stringify({ value }), { PX: ttlMs });
  } catch (error) {
    console.error(`Failed to write cache entry "${entryKey}":`, error);
  }

  return value;
};

export const bumpCacheNamespace = async (namespace: CacheNamespace): Promise<void> => {
  if (!isRedisEnabled()) {
    const current = getLocalNamespaceVersion(namespace);
    localNamespaceVersions.set(namespace, current + 1);
    return;
  }

  const redis = getRedisCommandClient();
  if (!redis) {
    const current = getLocalNamespaceVersion(namespace);
    localNamespaceVersions.set(namespace, current + 1);
    return;
  }

  const key = getNamespaceVersionKey(namespace);
  try {
    await redis.incr(key);
  } catch (error) {
    console.error(`Failed to bump cache namespace "${namespace}":`, error);
  }
};
