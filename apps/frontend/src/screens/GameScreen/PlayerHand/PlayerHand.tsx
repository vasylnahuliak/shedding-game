import { memo, useCallback, useMemo, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { View } from 'react-native';

import type { Card as CardType } from '@shedding-game/shared';

import { Card } from '@/components/Card';
import {
  type CardMetrics,
  GAME_PLAYER_HAND_CONTAINER_CLASS_NAME,
} from '@/components/Card/Card.settings';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { useGameScreenStore } from '@/hooks';
import { useAppTranslation } from '@/i18n';
import { badgeToneClassNames } from '@/theme';
import { getCardKey } from '@/utils/card';

import { useGameScreenContext } from '../GameScreenContext';

import { calculateLayout, PLAYER_HAND_SELECTED_LIFT } from './calculateLayout';

const PLAYER_HAND_SURFACE_CLASS_NAME =
  '-mx-2 overflow-visible rounded-t-[18px] border-t border-x-0 border-b-0 px-2.5 pb-1 pt-2';
const PLAYER_HAND_SCORE_CLASS_NAME = 'mb-1 text-center text-xs text-text-secondary';
const PLAYER_HAND_CONTAINER_CLASS_NAME = GAME_PLAYER_HAND_CONTAINER_CLASS_NAME;

type HandCardProps = {
  card: CardType;
  left: number;
  zIndex: number;
  top: number;
  isSelected: boolean;
  isPlayable: boolean;
  isAnimating: boolean;
  cardMetrics: CardMetrics;
  onToggle: (card: CardType) => void;
};

const HandCard = memo(function HandCard({
  card,
  left,
  zIndex,
  top,
  isSelected,
  isPlayable,
  isAnimating,
  cardMetrics,
  onToggle,
}: HandCardProps) {
  return (
    <View
      className="absolute"
      style={{
        left,
        zIndex,
        top,
        opacity: isAnimating ? 0 : 1,
      }}
    >
      <Card
        card={card}
        onPress={isPlayable ? () => onToggle(card) : undefined}
        selected={isSelected}
        disabled={!isPlayable}
        metrics={cardMetrics}
      />
    </View>
  );
});

export function PlayerHand() {
  const { t } = useAppTranslation('game');
  const selectedCards = useGameScreenStore((state) => state.selectedCards);
  const {
    myHand,
    myPlayer,
    isMyTurnEnabled,
    isEliminated,
    playableCards,
    toggleCardSelection,
    animatingCardKeys,
    handContainerRef,
    layoutMetrics,
  } = useGameScreenContext();
  const hand = myHand;
  const score = myPlayer?.score || 0;
  const isMyTurn = isMyTurnEnabled;
  const [containerWidth, setContainerWidth] = useState(0);
  const playableSet = useMemo(() => new Set(playableCards.map(getCardKey)), [playableCards]);
  const handleToggleCard = useCallback(
    (card: CardType) => {
      toggleCardSelection(card);
    },
    [toggleCardSelection]
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  const { offset: cardOffset, startLeft } = calculateLayout(
    containerWidth,
    hand.length,
    layoutMetrics.card
  );

  return (
    <Box
      className={mergeClassNames(
        PLAYER_HAND_SURFACE_CLASS_NAME,
        badgeToneClassNames.mutedSurface,
        isMyTurn && badgeToneClassNames.accentSurface,
        isEliminated && badgeToneClassNames.danger
      )}
    >
      <Text
        className={mergeClassNames(
          PLAYER_HAND_SCORE_CLASS_NAME,
          isEliminated && 'font-semibold text-feedback-danger'
        )}
      >
        {isEliminated
          ? t('playerHand.scoreEliminated', { count: score })
          : t('playerHand.score', { count: score })}
      </Text>
      <View
        className={PLAYER_HAND_CONTAINER_CLASS_NAME}
        onLayout={handleLayout}
        ref={handContainerRef}
      >
        {hand.map((item, index) => {
          const isSelected = selectedCards.some(
            (c) => c.rank === item.rank && c.suit === item.suit
          );
          const key = getCardKey(item);
          const isPlayable = isMyTurn && playableSet.has(key);
          const isAnimating = animatingCardKeys?.has(key);
          return (
            <HandCard
              key={key}
              card={item}
              left={startLeft + index * cardOffset}
              zIndex={isSelected ? 100 : index}
              top={isSelected ? 0 : PLAYER_HAND_SELECTED_LIFT}
              isSelected={isSelected}
              isPlayable={isPlayable}
              isAnimating={isAnimating}
              cardMetrics={layoutMetrics.handCard}
              onToggle={handleToggleCard}
            />
          );
        })}
      </View>
    </Box>
  );
}
