import { View } from 'react-native';

import type { Card as CardType } from '@shedding-game/shared';

import { Card } from '@/components/Card';
import { getCardKey } from '@/utils/card';

import { useGameScreenContext } from '../GameScreenContext';

type DiscardStackProps = {
  cards: CardType[];
  animatingKeys?: Set<string>;
};

/**
 * Renders the stacked discard pile cards.
 * Layout is computed based on visible (non-animating) cards so positions
 * stay stable during play-card animations.
 */
export const DiscardStack = function DiscardStack({ cards, animatingKeys }: DiscardStackProps) {
  const { layoutMetrics } = useGameScreenContext();
  const visibleCount = animatingKeys?.size
    ? cards.filter((c) => !animatingKeys.has(getCardKey(c))).length
    : cards.length;
  const layoutCount = Math.max(visibleCount, 1);
  const actualStackWidth =
    layoutMetrics.card.width + (layoutCount - 1) * layoutMetrics.center.stackCardOffset;
  const centerOffset = (layoutMetrics.center.stackTotalWidth - actualStackWidth) / 2;
  const topVisibleLeft = centerOffset + (layoutCount - 1) * layoutMetrics.center.stackCardOffset;

  let visibleIdx = 0;
  // Render oldest → newest (bottom → top)
  const ordered = [...cards].reverse();

  return (
    <>
      {ordered.map((card, i) => {
        const key = getCardKey(card);
        const isAnimating = animatingKeys?.has(key);
        const left = isAnimating
          ? topVisibleLeft
          : centerOffset + visibleIdx++ * layoutMetrics.center.stackCardOffset;

        return (
          <View
            key={`${card.suit}-${card.rank}-${i}`}
            className="absolute"
            style={[{ left, zIndex: i }, isAnimating && { opacity: 0 }]}
          >
            <Card card={card} metrics={layoutMetrics.card} />
          </View>
        );
      })}
    </>
  );
};
