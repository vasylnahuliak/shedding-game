import type { View } from 'react-native';

import type { CardMetrics } from '@/components/Card/Card.settings';
import { measureInWindowAsync } from '@/utils/measureInWindow';

type Position = { x: number; y: number; w: number; h: number };

/** Measure wrapper + deck and return deck origin relative to wrapper */
export async function measureDeckOrigin(
  gameWrapperRef: React.RefObject<View | null>,
  deckRef: React.RefObject<View | null>,
  cardMetrics: CardMetrics
): Promise<{ wrapperPos: Position; fromX: number; fromY: number }> {
  const [wrapperPos, deckPos] = await Promise.all([
    measureInWindowAsync(gameWrapperRef),
    measureInWindowAsync(deckRef),
  ]);

  return {
    wrapperPos,
    fromX: deckPos.x - wrapperPos.x + (deckPos.w - cardMetrics.width) / 2,
    fromY: deckPos.y - wrapperPos.y + (deckPos.h - cardMetrics.height) / 2,
  };
}

/** Measure wrapper + discard pile and return target position relative to wrapper */
export async function measureDiscardTarget(
  gameWrapperRef: React.RefObject<View | null>,
  discardPileRef: React.RefObject<View | null>,
  discardTopCardOffset: number,
  cardMetrics: CardMetrics
): Promise<{ wrapperPos: Position; toX: number; toY: number }> {
  const [wrapperPos, discardPos] = await Promise.all([
    measureInWindowAsync(gameWrapperRef),
    measureInWindowAsync(discardPileRef),
  ]);

  return {
    wrapperPos,
    toX: discardPos.x - wrapperPos.x + discardTopCardOffset,
    toY: discardPos.y - wrapperPos.y + (discardPos.h - cardMetrics.height) / 2,
  };
}

/** Delay before measuring so layout has settled after state update */
export const LAYOUT_SETTLE_DELAY = 50;

/** Extra buffer for safety timeout clearing animation keys */
export const SAFETY_TIMEOUT_BUFFER = 1000;
