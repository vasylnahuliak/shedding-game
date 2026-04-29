import React from 'react';
import Animated from 'react-native-reanimated';

import { Card } from '@/components/Card';

import { useGameScreenContext } from '../GameScreenContext';

import {
  PLAY_ANIMATION_DURATION,
  PLAY_ARC_HEIGHT,
  PLAY_SCALE_PEAK,
} from './CardAnimationLayer.settings';
import type { PlayCardItem } from './CardAnimationLayer.types';
import { useFlyingCardAnimation } from './useFlyingCardAnimation';

const ANIMATION_CONFIG = {
  duration: PLAY_ANIMATION_DURATION,
  arcHeight: PLAY_ARC_HEIGHT,
  scaleKeyframes: { input: [0, 0.4, 1], output: [1, PLAY_SCALE_PEAK, 1] },
};

type FlyingPlayCardProps = {
  item: PlayCardItem;
  onDone: (id: string) => void;
};

export function FlyingPlayCard({ item, onDone }: FlyingPlayCardProps) {
  const { layoutMetrics } = useGameScreenContext();
  const { containerStyle } = useFlyingCardAnimation({
    item,
    config: ANIMATION_CONFIG,
    onDone,
  });

  return (
    <Animated.View style={containerStyle}>
      <Card card={item.card} interactive={false} metrics={layoutMetrics.card} />
    </Animated.View>
  );
}
