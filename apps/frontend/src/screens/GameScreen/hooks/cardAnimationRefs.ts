import type { View } from 'react-native';

import type { CardAnimationHandle } from '../CardAnimationLayer';

export type AnimationLayerRef = {
  current: CardAnimationHandle | null;
};

export type ViewRef = {
  current: View | null;
};

export type OpponentRefsRef = {
  current: Map<string, View>;
};

export type NumberRef = {
  current: number;
};

export type PromiseQueueRef = {
  current: Promise<void>;
};

export type QueueBatch = (
  queue: PromiseQueueRef,
  run: (generation: number) => Promise<void>
) => void;
