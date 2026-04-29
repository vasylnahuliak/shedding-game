import { useEffect, useRef, useState } from 'react';

import type { GamePace } from '@shedding-game/shared';

import { getGamePaceConfig } from '@shedding-game/shared';

import { playTimerExpiredHaptic, playTimerWarningHaptic } from '@/services/haptics';

const TIMER_TICK_MS = 1_000;

type UseTurnTimerParams = {
  isActive: boolean;
  gamePace: GamePace;
  turnStartedAt: number | null;
  shouldHaptics?: boolean;
};

export const useTurnTimer = ({
  isActive,
  gamePace,
  turnStartedAt,
  shouldHaptics = false,
}: UseTurnTimerParams) => {
  const [now, setNow] = useState(() => Date.now());
  const warnedTurnRef = useRef<number | null>(null);
  const expiredTurnRef = useRef<number | null>(null);
  const { criticalMs, visibleDurationMs, warningDelayMs, warningMs } = getGamePaceConfig(gamePace);
  const warningStartsAt = turnStartedAt ? turnStartedAt + warningDelayMs : null;
  const isVisible = isActive && warningStartsAt !== null && now >= warningStartsAt;
  const warningElapsedMs = isVisible && warningStartsAt ? Math.max(0, now - warningStartsAt) : 0;
  const remainingMs = isVisible
    ? Math.max(0, visibleDurationMs - warningElapsedMs)
    : visibleDurationMs;
  const isWarning = remainingMs > 0 && remainingMs <= warningMs;
  const isCritical = remainingMs > 0 && remainingMs <= criticalMs;
  const isExpired = remainingMs === 0;

  useEffect(
    function syncTurnTimerClock() {
      if (!isActive || !turnStartedAt) {
        return;
      }

      const immediateRefresh = setTimeout(() => {
        setNow(Date.now());
      }, 0);

      if (!warningStartsAt) {
        return () => {
          clearTimeout(immediateRefresh);
        };
      }

      if (!isVisible) {
        const showTimerTimeout = setTimeout(
          () => {
            setNow(Date.now());
          },
          Math.max(0, warningStartsAt - Date.now())
        );

        return () => {
          clearTimeout(immediateRefresh);
          clearTimeout(showTimerTimeout);
        };
      }

      if (isExpired) {
        return () => {
          clearTimeout(immediateRefresh);
        };
      }

      const timer = setInterval(() => {
        setNow(Date.now());
      }, TIMER_TICK_MS);

      return () => {
        clearTimeout(immediateRefresh);
        clearInterval(timer);
      };
    },
    [isActive, isExpired, isVisible, turnStartedAt, warningStartsAt]
  );

  const progress = isVisible ? Math.min(1, remainingMs / visibleDurationMs) : 1;

  useEffect(
    function syncTurnTimerHaptics() {
      // eslint-disable-next-line react-you-might-not-need-an-effect/no-event-handler -- haptics are a legitimate side effect of timer state transitions, not an event handler anti-pattern
      if (!shouldHaptics || !isActive || !isVisible || !turnStartedAt) {
        return;
      }

      // eslint-disable-next-line react-you-might-not-need-an-effect/no-event-handler -- same as above
      if (isWarning && warnedTurnRef.current !== turnStartedAt) {
        playTimerWarningHaptic();
        warnedTurnRef.current = turnStartedAt;
      }

      // eslint-disable-next-line react-you-might-not-need-an-effect/no-event-handler -- same as above
      if (isExpired && expiredTurnRef.current !== turnStartedAt) {
        playTimerExpiredHaptic();
        expiredTurnRef.current = turnStartedAt;
      }
    },
    [isActive, isExpired, isVisible, isWarning, shouldHaptics, turnStartedAt]
  );

  return {
    isVisible,
    remainingMs,
    remainingSeconds: Math.ceil(remainingMs / 1_000),
    progress,
    isWarning,
    isCritical,
    isExpired,
  };
};
