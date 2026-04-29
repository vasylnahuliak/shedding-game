import React from 'react';
import Animated from 'react-native-reanimated';

import {
  OPPONENT_CARD_END_SCALE,
  OPPONENT_DRAW_ARC_HEIGHT,
  OPPONENT_DRAW_DURATION,
} from './CardAnimationLayer.settings';
import type { OpponentDrawItem } from './CardAnimationLayer.types';
import { CardBackView } from './FlippableCardView';
import { useFlyingCardAnimation } from './useFlyingCardAnimation';

const ANIMATION_CONFIG = {
  duration: OPPONENT_DRAW_DURATION,
  arcHeight: OPPONENT_DRAW_ARC_HEIGHT,
  scaleKeyframes: { input: [0, 1], output: [1, OPPONENT_CARD_END_SCALE] },
};

type FlyingCardBackProps = {
  item: OpponentDrawItem;
  onDone: (id: string) => void;
};

export function FlyingCardBack({ item, onDone }: FlyingCardBackProps) {
  const { containerStyle } = useFlyingCardAnimation({
    item,
    config: ANIMATION_CONFIG,
    onDone,
  });

  return (
    <Animated.View style={containerStyle}>
      <CardBackView />
    </Animated.View>
  );
}
