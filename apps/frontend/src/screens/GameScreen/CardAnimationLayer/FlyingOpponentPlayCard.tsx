import React from 'react';
import Animated from 'react-native-reanimated';

import {
  OPPONENT_PLAY_ARC_HEIGHT,
  OPPONENT_PLAY_DURATION,
  OPPONENT_PLAY_START_SCALE,
} from './CardAnimationLayer.settings';
import type { OpponentPlayCardItem } from './CardAnimationLayer.types';
import { FlippableCardView } from './FlippableCardView';
import { useFlipAnimation, useFlyingCardAnimation } from './useFlyingCardAnimation';

const ANIMATION_CONFIG = {
  duration: OPPONENT_PLAY_DURATION,
  arcHeight: OPPONENT_PLAY_ARC_HEIGHT,
  scaleKeyframes: { input: [0, 0.5, 1], output: [OPPONENT_PLAY_START_SCALE, 1.1, 1] },
};

/** Progress-based flip keyframes for opponent play card */
const FLIP_KEYFRAMES = { input: [0, 0.4, 0.5, 1], output: [1, 1, 0, 0] };

type FlyingOpponentPlayCardProps = {
  item: OpponentPlayCardItem;
  onDone: (id: string) => void;
};

export function FlyingOpponentPlayCard({ item, onDone }: FlyingOpponentPlayCardProps) {
  const { progress, containerStyle } = useFlyingCardAnimation({
    item,
    config: ANIMATION_CONFIG,
    onDone,
  });

  const { backStyle, frontStyle } = useFlipAnimation({
    flipConfig: { delay: 0, duration: 0 },
    progressValue: progress,
    flipKeyframes: FLIP_KEYFRAMES,
  });

  return (
    <Animated.View style={containerStyle}>
      <FlippableCardView backStyle={backStyle} frontStyle={frontStyle} card={item.card} />
    </Animated.View>
  );
}
