import { Presets } from 'react-native-pulsar';

import { useAuthStore } from '@/hooks/useAuthStore';

const canPlayHaptics = () => useAuthStore.getState().user?.hapticsEnabled ?? true;

export function playSelectionHaptic(): void {
  if (!canPlayHaptics()) {
    return;
  }

  Presets.System.selection();
}

export function playReactionHaptic(): void {
  if (!canPlayHaptics()) {
    return;
  }

  Presets.push();
}

export function playActionHaptic(): void {
  if (!canPlayHaptics()) {
    return;
  }

  Presets.propel();
}

export function playTimerWarningHaptic(): void {
  if (!canPlayHaptics()) {
    return;
  }

  Presets.System.notificationWarning();
}

export function playTimerExpiredHaptic(): void {
  if (!canPlayHaptics()) {
    return;
  }

  Presets.powerDown();
}
