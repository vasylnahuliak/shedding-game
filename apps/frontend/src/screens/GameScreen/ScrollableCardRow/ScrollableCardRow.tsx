import type { Card as GameCard } from '@shedding-game/shared';

import { Card } from '@/components/Card';
import { GAME_CARD_METRICS } from '@/components/Card/Card.settings';
import { Box } from '@/components/ui/box';
import { StyledScrollView } from '@/components/ui/interop';

type ScrollableCardRowProps = {
  cards: GameCard[];
  contentContainerClassName?: string;
  rowClassName?: string;
};

export const ScrollableCardRow = function ScrollableCardRow({
  cards,
  contentContainerClassName,
  rowClassName = 'flex-row gap-3',
}: ScrollableCardRowProps) {
  return (
    <StyledScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName={contentContainerClassName}
    >
      <Box className={rowClassName}>
        {cards.map((card, index) => (
          <Card
            key={`${card.suit}-${card.rank}-${index}`}
            card={card}
            interactive={false}
            metrics={GAME_CARD_METRICS}
          />
        ))}
      </Box>
    </StyledScrollView>
  );
};
