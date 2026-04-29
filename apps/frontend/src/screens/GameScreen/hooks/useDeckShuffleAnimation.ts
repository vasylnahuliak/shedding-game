import { useCallback, useRef, useState } from 'react';

import {
  SHUFFLE_ANIMATION_DURATION,
  SHUFFLE_SETTLE_DURATION,
} from '../CardAnimationLayer/CardAnimationLayer.settings';

/** Total duration of the shuffle animation including settle */
export const TOTAL_SHUFFLE_DURATION = SHUFFLE_ANIMATION_DURATION + SHUFFLE_SETTLE_DURATION;

type UseDeckShuffleAnimationReturn = {
  /** Whether the shuffle animation is currently playing */
  isShuffling: boolean;
  /** Start the shuffle animation, returns a promise that resolves when complete */
  startShuffle: () => Promise<void>;
  /** Stop the shuffle animation immediately */
  stopShuffle: () => void;
  /** Handle shuffle animation completion (for DeckShuffleAnimation callback) */
  handleShuffleComplete: () => void;
};

export function useDeckShuffleAnimation(): UseDeckShuffleAnimationReturn {
  const [isShuffling, setIsShuffling] = useState(false);
  const resolveRef = useRef<(() => void) | null>(null);
  const fallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearFallbackTimeout = useCallback(() => {
    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = null;
    }
  }, []);

  const resolvePendingShuffle = useCallback(() => {
    if (resolveRef.current) {
      resolveRef.current();
      resolveRef.current = null;
    }
  }, []);

  const clearPendingShuffle = useCallback(() => {
    clearFallbackTimeout();
    resolvePendingShuffle();
  }, [clearFallbackTimeout, resolvePendingShuffle]);

  const handleShuffleComplete = useCallback(() => {
    clearPendingShuffle();
    setIsShuffling(false);
  }, [clearPendingShuffle]);

  const startShuffle = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      // Clear any previous state
      clearPendingShuffle();

      resolveRef.current = resolve;
      setIsShuffling(true);

      // Fallback timeout in case animation callback doesn't fire
      fallbackTimeoutRef.current = setTimeout(() => {
        handleShuffleComplete();
      }, TOTAL_SHUFFLE_DURATION + 100);
    });
  }, [clearPendingShuffle, handleShuffleComplete]);

  const stopShuffle = useCallback(() => {
    clearPendingShuffle();
    setIsShuffling(false);
  }, [clearPendingShuffle]);

  return {
    isShuffling,
    startShuffle,
    stopShuffle,
    handleShuffleComplete,
  };
}
