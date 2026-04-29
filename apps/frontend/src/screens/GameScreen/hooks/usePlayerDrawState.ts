import { useCallback, useState } from 'react';

import { mergeKeys, subtractKeys } from './cardAnimationUtils';

export function usePlayerDrawState() {
  const [playerDrawAnimatingKeys, setPlayerDrawAnimatingKeys] = useState<Set<string>>(new Set());

  const addPlayerDrawKeys = useCallback((keys: string[]) => {
    setPlayerDrawAnimatingKeys((prev) => mergeKeys(prev, keys));
  }, []);

  const removePlayerDrawKeys = useCallback((keys: string[]) => {
    setPlayerDrawAnimatingKeys((prev) => subtractKeys(prev, keys));
  }, []);

  const resetPlayerDrawState = useCallback(() => {
    setPlayerDrawAnimatingKeys(new Set());
  }, []);

  return {
    playerDrawAnimatingKeys,
    addPlayerDrawKeys,
    removePlayerDrawKeys,
    resetPlayerDrawState,
  };
}
