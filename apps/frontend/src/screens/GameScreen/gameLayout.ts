import { type CardMetrics, GAME_CARD_METRICS } from '@/components/Card/Card.settings';

export type GameLayoutMetrics = {
  card: CardMetrics;
  handCard: CardMetrics;
  center: {
    stackCardOffset: number;
    stackTotalWidth: number;
    deckCardInset: number;
  };
  reactionButtonSize: number;
};

export const gameLayoutMetrics: GameLayoutMetrics = {
  card: GAME_CARD_METRICS,
  handCard: GAME_CARD_METRICS,
  center: {
    stackCardOffset: 24,
    stackTotalWidth: 136,
    deckCardInset: 2,
  },
  reactionButtonSize: 34,
};
