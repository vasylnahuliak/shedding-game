import type { OpponentDraw } from './animationDetection';

export type PendingOpponentDrawCounts = Record<string, number>;

type KeySetOperation = 'add' | 'remove';

type KeyedAnimationBatchControls = {
  markDispatched: () => void;
  completeKey: (key: string) => void;
  dropKey: (key: string) => void;
};

function waitFor(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, Math.max(0, ms));
  });
}

async function awaitAnimationGeneration(params: {
  generation: number;
  delayMs: number;
  isGenerationActive: (generation: number) => boolean;
}) {
  await waitFor(params.delayMs);
  return params.isGenerationActive(params.generation);
}

export async function runQueuedAnimationTask<Layer>(params: {
  generation: number;
  delayMs: number;
  isGenerationActive: (generation: number) => boolean;
  getLayer: () => Layer | null;
  onMissingLayer: () => void;
  onError: () => void;
  run: (layer: Layer) => Promise<void>;
}) {
  if (
    !(await awaitAnimationGeneration({
      generation: params.generation,
      delayMs: params.delayMs,
      isGenerationActive: params.isGenerationActive,
    }))
  ) {
    return;
  }

  const layer = params.getLayer();
  if (!layer) {
    params.onMissingLayer();
    return;
  }

  try {
    await params.run(layer);
  } catch {
    params.onError();
  }
}

function updateKeys(prev: Set<string>, keys: Iterable<string>, operation: KeySetOperation) {
  const next = new Set(prev);
  let changed = false;

  for (const key of keys) {
    const didChange = operation === 'add' ? !next.has(key) : next.has(key);
    if (!didChange) continue;

    changed = true;
    if (operation === 'add') {
      next.add(key);
    } else {
      next.delete(key);
    }
  }

  return changed ? next : prev;
}

export function mergeKeys(prev: Set<string>, keys: Iterable<string>) {
  return updateKeys(prev, keys, 'add');
}

export function subtractKeys(prev: Set<string>, keys: Iterable<string>) {
  return updateKeys(prev, keys, 'remove');
}

export function applyPendingDrawDeltas(
  prev: PendingOpponentDrawCounts,
  deltas: Record<string, number>
): PendingOpponentDrawCounts {
  let next: PendingOpponentDrawCounts | null = null;

  for (const [playerId, delta] of Object.entries(deltas)) {
    if (delta === 0) continue;

    const current = prev[playerId] ?? 0;
    const updated = Math.max(0, current + delta);
    if (updated === current) continue;

    if (!next) next = { ...prev };

    if (updated === 0) {
      delete next[playerId];
    } else {
      next[playerId] = updated;
    }
  }

  return next ?? prev;
}

export function buildDrawDeltaMap(draws: OpponentDraw[], multiplier: 1 | -1) {
  return draws.reduce<Record<string, number>>((acc, draw) => {
    acc[draw.playerId] = (acc[draw.playerId] ?? 0) + draw.count * multiplier;
    return acc;
  }, {});
}

export function getStaggeredBatchDuration(count: number, staggerDelay: number, duration: number) {
  if (count <= 0) return 0;
  return (count - 1) * staggerDelay + duration;
}

export async function runKeyedAnimationBatch(params: {
  keys: Iterable<string>;
  timeoutMs: number;
  resolveKeys: (keys: string[]) => void;
  schedule: (controls: KeyedAnimationBatchControls) => void;
}) {
  const keyList = Array.from(params.keys);

  await new Promise<void>((resolve) => {
    let dispatched = 0;
    let completed = 0;
    let settled = false;
    let fallbackTimeout: ReturnType<typeof setTimeout> | null = null;
    const remainingKeys = new Set(keyList);

    const finish = () => {
      if (settled) return;
      settled = true;
      if (fallbackTimeout) {
        clearTimeout(fallbackTimeout);
      }
      if (remainingKeys.size > 0) {
        params.resolveKeys([...remainingKeys]);
      }
      resolve();
    };

    const dropKey = (key: string) => {
      if (remainingKeys.delete(key)) {
        params.resolveKeys([key]);
      }
    };

    params.schedule({
      markDispatched: () => {
        dispatched += 1;
      },
      completeKey: (key) => {
        dropKey(key);
        completed += 1;
        if (completed >= dispatched) {
          finish();
        }
      },
      dropKey,
    });

    if (dispatched === 0) {
      finish();
      return;
    }

    fallbackTimeout = setTimeout(finish, params.timeoutMs);
  });
}
