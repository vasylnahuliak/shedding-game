import type { ReactNode } from 'react';
import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';
import type { AnimatedStyle } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';

import type { Card as CardType } from '@shedding-game/shared';

import { Card } from '@/components/Card';

import { useGameScreenContext } from '../GameScreenContext';

import { cardBackClassName } from './cardAnimationStyles';

type FlippableCardViewProps = {
  /** Animated style for the back face (opacity) */
  backStyle: AnimatedStyle<StyleProp<ViewStyle>>;
  /** Animated style for the front face (opacity) */
  frontStyle: AnimatedStyle<StyleProp<ViewStyle>>;
  /** The card to show on the front face */
  card: CardType;
  /** Whether the card should appear disabled */
  disabled?: boolean;
};

/**
 * A component that renders a flippable card with back and front faces.
 * Uses absolute positioning for overlapping faces with opacity transitions.
 */
export function FlippableCardView({
  backStyle,
  frontStyle,
  card,
  disabled,
}: FlippableCardViewProps) {
  const { layoutMetrics } = useGameScreenContext();

  return (
    <>
      <Animated.View className="absolute inset-0" style={backStyle}>
        <View className={cardBackClassName} />
      </Animated.View>
      <Animated.View className="absolute inset-0" style={frontStyle}>
        <Card card={card} disabled={disabled} interactive={false} metrics={layoutMetrics.card} />
      </Animated.View>
    </>
  );
}

type CardBackViewProps = {
  children?: ReactNode;
};

/**
 * Simple card back view wrapper for consistency.
 */
export function CardBackView({ children }: CardBackViewProps) {
  useGameScreenContext();

  return <View className={cardBackClassName}>{children}</View>;
}
