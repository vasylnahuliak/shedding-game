import React from 'react';
import Animated from 'react-native-reanimated';

import {
  DRAW_ANIMATION_DURATION,
  DRAW_ARC_HEIGHT,
  DRAW_SCALE_PEAK,
  FLIP_DELAY_RATIO,
  FLIP_DURATION_RATIO,
} from './CardAnimationLayer.settings';
import type { AnimationItem } from './CardAnimationLayer.types';
import { FlippableCardView } from './FlippableCardView';
import { useFlipAnimation, useFlyingCardAnimation } from './useFlyingCardAnimation';

const ANIMATION_CONFIG = {
  duration: DRAW_ANIMATION_DURATION,
  arcHeight: DRAW_ARC_HEIGHT,
  scaleKeyframes: { input: [0, 0.4, 1], output: [1, DRAW_SCALE_PEAK, 1] },
};

type FlyingCardProps = {
  item: AnimationItem;
  onDone: (id: string) => void;
};

export function FlyingCard({ item, onDone }: FlyingCardProps) {
  const { containerStyle } = useFlyingCardAnimation({
    item,
    config: ANIMATION_CONFIG,
    onDone,
  });

  const { backStyle, frontStyle } = useFlipAnimation({
    flipConfig: {
      delay: item.delay + DRAW_ANIMATION_DURATION * FLIP_DELAY_RATIO,
      duration: DRAW_ANIMATION_DURATION * FLIP_DURATION_RATIO,
    },
  });

  return (
    <Animated.View style={containerStyle}>
      <FlippableCardView
        backStyle={backStyle}
        frontStyle={frontStyle}
        card={item.card}
        disabled={item.disabled}
      />
    </Animated.View>
  );
}
