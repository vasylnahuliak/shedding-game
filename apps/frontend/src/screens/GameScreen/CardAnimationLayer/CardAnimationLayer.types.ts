import type { Card } from '@shedding-game/shared';

/** Shared base for all flying-card animation items */
export type FlyingItemBase = {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  delay: number;
};

/** Player draw: card back → flip → card face (deck → hand) */
export type AnimationItem = FlyingItemBase & { card: Card; disabled?: boolean };

/** Opponent draw: card back only (deck → opponent hand) */
export type OpponentDrawItem = FlyingItemBase;

/** Play card: card face (hand → discard pile) */
export type PlayCardItem = FlyingItemBase & { card: Card };

/** Opponent play card: card back → flip → card face (opponent hand → discard pile) */
export type OpponentPlayCardItem = FlyingItemBase & { card: Card };

/** Params for animations that carry a card */
type CardAnimationParams = {
  card: Card;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  delay?: number;
  disabled?: boolean;
  onComplete?: () => void;
};

/** Params for card-back-only animations */
type BackAnimationParams = Omit<CardAnimationParams, 'card'>;

export type CardAnimationHandle = {
  animateDrawCard: (params: CardAnimationParams) => void;
  animateOpponentDraw: (params: BackAnimationParams) => void;
  animatePlayCard: (params: CardAnimationParams) => void;
  animateOpponentPlayCard: (params: CardAnimationParams) => void;
  clearAll: () => void;
};
