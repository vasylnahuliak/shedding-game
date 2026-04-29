import { useEffect, useEffectEvent } from 'react';
import type { ViewStyle } from 'react-native';
import { View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { GAME_CARD_ABSOLUTE_FRAME_CLASS_NAME } from '@/components/Card/Card.settings';

import {
  SHUFFLE_ANIMATION_DURATION,
  SHUFFLE_CARD_SPREAD,
  SHUFFLE_ITERATIONS,
  SHUFFLE_SETTLE_DURATION,
} from '../CardAnimationLayer/CardAnimationLayer.settings';
import { cardBackClassName } from '../CardAnimationLayer/cardAnimationStyles';

import { SHUFFLE_CARD_COUNT } from './DeckShuffleAnimation.settings';
import type { DeckShuffleAnimationProps } from './DeckShuffleAnimation.types';

const ITERATION_DURATION = SHUFFLE_ANIMATION_DURATION / SHUFFLE_ITERATIONS;
const SHUFFLE_CARD_INDICES = Array.from({ length: SHUFFLE_CARD_COUNT }, (_, i) => i);

/** Hook to create animated style for a single shuffle card */
function useShuffleCardStyle(
  index: number,
  progress: SharedValue<number>,
  settleProgress: SharedValue<number>
) {
  const isLeftStack = index % 2 === 0;
  const cardIndex = Math.floor(index / 2);
  const baseOffset = cardIndex * 2;
  const baseZIndex = SHUFFLE_CARD_COUNT - index;

  return useAnimatedStyle((): ViewStyle => {
    // Calculate the fractional part of progress for current iteration
    const iterProgress = progress.value % 1;
    // During spread (0 -> 0.5): cards move out
    // During gather (0.5 -> 1): cards move back with alternating z-index effect

    const spreadAmount = interpolate(iterProgress, [0, 0.5, 1], [0, 1, 0]);

    // Horizontal displacement during shuffle
    const xOffset =
      spreadAmount * SHUFFLE_CARD_SPREAD * (isLeftStack ? -1 : 1) * (1 - settleProgress.value);

    // Vertical offset for stacking effect
    const yBase = -baseOffset;
    const gatherPhase = iterProgress > 0.5;
    const yJitter = gatherPhase
      ? interpolate(iterProgress, [0.5, 0.75, 1], [0, -5, 0]) * (index % 3 === 0 ? 1 : -0.5)
      : 0;
    const yOffset = yBase + yJitter * (1 - settleProgress.value);

    // Rotation during shuffle
    const rotation = spreadAmount * (isLeftStack ? -8 : 8) * (1 - settleProgress.value);

    // Scale pulse on settle
    const settleScale = interpolate(settleProgress.value, [0, 0.5, 1], [1, 1.05, 1]);

    // Z-index changes during gather
    const zIndexBoost = gatherPhase && index % 2 === Math.floor(progress.value) % 2 ? 10 : 0;

    return {
      transform: [
        { translateX: xOffset },
        { translateY: yOffset },
        { rotate: `${rotation}deg` },
        { scale: settleScale },
      ],
      zIndex: baseZIndex + zIndexBoost,
    };
  });
}

type ShuffleCardProps = {
  index: number;
  progress: SharedValue<number>;
  settleProgress: SharedValue<number>;
};

function ShuffleCard({ index, progress, settleProgress }: ShuffleCardProps) {
  const animatedStyle = useShuffleCardStyle(index, progress, settleProgress);

  return (
    <Animated.View className={GAME_CARD_ABSOLUTE_FRAME_CLASS_NAME} style={animatedStyle}>
      <View className={cardBackClassName} />
    </Animated.View>
  );
}

export function DeckShuffleAnimation({
  isAnimating,
  onAnimationComplete,
}: DeckShuffleAnimationProps) {
  const progress = useSharedValue(0);
  const settleProgress = useSharedValue(0);

  const handleComplete = useEffectEvent(() => {
    onAnimationComplete?.();
  });

  useEffect(
    function startDeckShuffleAnimation() {
      if (!isAnimating) {
        progress.value = 0;
        settleProgress.value = 0;
        return;
      }

      // Reset and start animation
      progress.value = 0;
      settleProgress.value = 0;

      // Create shuffle sequence: spread out → gather → repeat
      const shuffleSequence = Array.from({ length: SHUFFLE_ITERATIONS }).flatMap((_, i) => [
        withTiming(i + 0.5, {
          duration: ITERATION_DURATION * 0.5,
          easing: Easing.out(Easing.quad),
        }),
        withTiming(i + 1, {
          duration: ITERATION_DURATION * 0.5,
          easing: Easing.in(Easing.quad),
        }),
      ]);

      progress.value = withSequence(...shuffleSequence);

      // After shuffle completes, settle animation
      settleProgress.value = withDelay(
        SHUFFLE_ANIMATION_DURATION,
        withTiming(
          1,
          {
            duration: SHUFFLE_SETTLE_DURATION,
            easing: Easing.out(Easing.back(1.5)),
          },
          (finished) => {
            if (finished) scheduleOnRN(handleComplete);
          }
        )
      );
    },
    [isAnimating, progress, settleProgress]
  );

  if (!isAnimating) {
    return null;
  }

  return (
    <View className={GAME_CARD_ABSOLUTE_FRAME_CLASS_NAME}>
      {SHUFFLE_CARD_INDICES.map((index) => (
        <ShuffleCard
          key={index}
          index={index}
          progress={progress}
          settleProgress={settleProgress}
        />
      ))}
    </View>
  );
}
