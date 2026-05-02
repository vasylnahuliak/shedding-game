import { Pressable, StyleSheet } from 'react-native';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { getSuitSymbol, isRedSuit } from '@/utils/card';

import {
  CARD_METRIC_PRESET_CLASS_NAMES,
  DEFAULT_CARD_METRICS,
  getCardMetricPreset,
  SMALL_CARD_METRICS,
} from './Card.settings';
import type { CardProps } from './Card.types';

const styles = StyleSheet.create({
  cardFace: {
    backgroundColor: '#FFFFFF',
  },
});

export function Card({
  card,
  onPress,
  selected,
  size = 'big',
  disabled,
  transparent,
  interactive = true,
  metrics,
}: CardProps) {
  const isRed = isRedSuit(card.suit);
  const suitSymbol = getSuitSymbol(card.suit);
  const resolvedMetrics = size === 'small' ? SMALL_CARD_METRICS : (metrics ?? DEFAULT_CARD_METRICS);
  const metricPreset = getCardMetricPreset(resolvedMetrics);
  const metricClassNames = metricPreset ? CARD_METRIC_PRESET_CLASS_NAMES[metricPreset] : null;

  const cardClassName = mergeClassNames(
    'items-start justify-start',
    metricClassNames?.frame,
    metricClassNames?.padding,
    size === 'small' && 'mx-0.5',
    metricClassNames ? (selected ? metricClassNames.selectedBorder : 'border') : undefined,
    transparent
      ? 'border-overlay-scrim bg-transparent'
      : selected
        ? 'border-border-accent bg-[#FFFFFF]'
        : 'border-border-card-face bg-[#FFFFFF]'
  );
  const cornerTextClassName = mergeClassNames(
    metricClassNames?.cornerText,
    'font-bold',
    isRed ? 'text-feedback-danger' : 'text-text-on-card-face',
    disabled && 'opacity-60'
  );
  const cardStyle = metricClassNames
    ? transparent
      ? undefined
      : styles.cardFace
    : [
        {
          width: resolvedMetrics.width,
          height: resolvedMetrics.height,
          borderRadius: resolvedMetrics.borderRadius,
          padding: resolvedMetrics.padding,
          borderWidth: selected ? resolvedMetrics.selectedBorderWidth : 1,
        },
        transparent ? undefined : styles.cardFace,
      ];
  const cornerTextStyle = metricClassNames
    ? undefined
    : {
        fontSize: resolvedMetrics.cornerFontSize,
        lineHeight: resolvedMetrics.cornerLineHeight,
      };
  const renderCorner = (className?: string) => (
    <Box className={mergeClassNames('flex-col items-center', className)}>
      <Text className={cornerTextClassName} style={cornerTextStyle}>
        {card.rank}
      </Text>
      <Text className={cornerTextClassName} style={cornerTextStyle}>
        {suitSymbol}
      </Text>
    </Box>
  );
  const content = (
    <>
      {renderCorner()}
      {disabled && (
        <Box
          className={mergeClassNames(
            'absolute inset-0 bg-overlay-scrim',
            metricClassNames?.overlayRadius
          )}
          style={metricClassNames ? undefined : { borderRadius: resolvedMetrics.borderRadius }}
        />
      )}
    </>
  );

  if (!interactive) {
    return (
      <Box className={cardClassName} style={cardStyle}>
        {content}
      </Box>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress || disabled}
      className={cardClassName}
      style={cardStyle}
    >
      {content}
    </Pressable>
  );
}
