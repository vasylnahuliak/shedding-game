import type { Card as CardType } from '@shedding-game/shared';

import type { CardMetrics } from './Card.settings';

export type CardSize = 'small' | 'big';

export interface CardProps {
  card: CardType;
  onPress?: () => void;
  selected?: boolean;
  size?: CardSize;
  disabled?: boolean;
  transparent?: boolean;
  interactive?: boolean;
  metrics?: CardMetrics;
}
