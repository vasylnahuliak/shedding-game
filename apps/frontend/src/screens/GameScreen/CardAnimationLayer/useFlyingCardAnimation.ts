import { useEffect, useEffectEvent, useMemo } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useGameScreenContext } from '../GameScreenContext';

import type { FlyingItemBase } from './CardAnimationLayer.types';

/** Common easing for all flying card animations */
const FLYING_CARD_EASING = Easing.bezier(0.4, 0, 0.2, 1);

type AnimationConfig = {
  duration: number;
  arcHeight: number;
  /** Scale keyframes: [progress, ...progressN] → [scale, ...scaleN] */
  scaleKeyframes: { input: number[]; output: number[] };
};

type UseFlyingCardAnimationParams = {
  item: FlyingItemBase;
  config: AnimationConfig;
  onDone: (id: string) => void;
};

/**
 * Hook that manages flying card animation progress and container style.
 * Returns the progress shared value and the animated container style.
 */
export function useFlyingCardAnimation({ item, config, onDone }: UseFlyingCardAnimationParams) {
  const { layoutMetrics } = useGameScreenContext();
  const progress = useSharedValue(0);

  const stableOnDone = useEffectEvent((id: string) => {
    onDone(id);
  });

  useEffect(
    function startFlyingCardAnimation() {
      progress.value = withDelay(
        item.delay,
        withTiming(1, { duration: config.duration, easing: FLYING_CARD_EASING }, (finished) => {
          if (finished) scheduleOnRN(stableOnDone, item.id);
        })
      );
    },
    [config.duration, item.delay, item.id, progress]
  );

  // Only animate transform — static layout props must not live inside the worklet
  const containerAnimatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(progress.value, [0, 1], [0, item.toX - item.fromX]);
    const translateY = interpolate(progress.value, [0, 1], [0, item.toY - item.fromY]);
    const arc = -config.arcHeight * Math.sin(progress.value * Math.PI);
    const scale = interpolate(
      progress.value,
      config.scaleKeyframes.input,
      config.scaleKeyframes.output
    );

    return {
      transform: [{ translateX }, { translateY: translateY + arc }, { scale }],
    };
  });

  const containerStyle = useMemo(
    () => [
      {
        position: 'absolute' as const,
        left: item.fromX,
        top: item.fromY,
        width: layoutMetrics.card.width,
        height: layoutMetrics.card.height,
        zIndex: 1000,
      },
      containerAnimatedStyle,
    ],
    [
      containerAnimatedStyle,
      item.fromX,
      item.fromY,
      layoutMetrics.card.height,
      layoutMetrics.card.width,
    ]
  );

  return { progress, containerStyle };
}

type FlipConfig = {
  /** Delay before flip starts (ms) */
  delay: number;
  /** Duration of flip animation (ms) */
  duration: number;
};

type UseFlipAnimationParams = {
  flipConfig: FlipConfig;
  /** Progress value to sync flip with (optional, for progress-based flip) */
  progressValue?: SharedValue<number>;
  /** Flip keyframes for opacity interpolation when using progressValue */
  flipKeyframes?: { input: number[]; output: number[] };
};

const DEFAULT_BACK_KEYFRAMES = {
  input: [0, 0.49, 0.5, 1],
  output: [1, 1, 0, 0],
};

const DEFAULT_FRONT_KEYFRAMES = {
  input: [0, 0.49, 0.5, 1],
  output: [0, 0, 1, 1],
};

const invertKeyframeOutput = (output: number[]) => output.map((value) => 1 - value);

/**
 * Hook that manages card flip animation (back → front).
 * Returns animated styles for back and front faces.
 */
export function useFlipAnimation({
  flipConfig,
  progressValue,
  flipKeyframes,
}: UseFlipAnimationParams) {
  const flip = useSharedValue(0);
  const backKeyframes = flipKeyframes ?? DEFAULT_BACK_KEYFRAMES;
  const frontKeyframes = flipKeyframes
    ? { input: flipKeyframes.input, output: invertKeyframeOutput(flipKeyframes.output) }
    : DEFAULT_FRONT_KEYFRAMES;

  useEffect(
    function startFlipAnimation() {
      if (!progressValue) {
        flip.value = withDelay(
          flipConfig.delay,
          withTiming(1, {
            duration: flipConfig.duration,
            easing: Easing.inOut(Easing.ease),
          })
        );
      }
    },
    [flip, flipConfig.delay, flipConfig.duration, progressValue]
  );

  const backStyle = useAnimatedStyle(() => {
    const value = progressValue ? progressValue.value : flip.value;

    return {
      opacity: interpolate(value, backKeyframes.input, backKeyframes.output),
    };
  });

  const frontStyle = useAnimatedStyle(() => {
    const value = progressValue ? progressValue.value : flip.value;

    return {
      opacity: interpolate(value, frontKeyframes.input, frontKeyframes.output),
    };
  });

  return { flip, backStyle, frontStyle };
}
