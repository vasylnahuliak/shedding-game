import type { CardMetrics } from '@/components/Card/Card.settings';

const PLAYER_HAND_CONTAINER_PADDING_HORIZONTAL = 8;
export const PLAYER_HAND_SELECTED_LIFT = 10;

const PLAYER_HAND_CARD_GAP = 7;
const PLAYER_HAND_MIN_VISIBLE_WIDTH = 18;

export function calculateLayout(
  containerWidth: number,
  cardCount: number,
  cardMetrics: CardMetrics
) {
  const baseOffset = cardMetrics.width + PLAYER_HAND_CARD_GAP;
  if (containerWidth === 0 || cardCount <= 1) {
    const availableWidth = containerWidth - PLAYER_HAND_CONTAINER_PADDING_HORIZONTAL * 2;
    const centeredLeft =
      PLAYER_HAND_CONTAINER_PADDING_HORIZONTAL +
      Math.max(0, (availableWidth - cardMetrics.width) / 2);
    return { offset: baseOffset, startLeft: centeredLeft };
  }

  const availableWidth = containerWidth - PLAYER_HAND_CONTAINER_PADDING_HORIZONTAL * 2;
  const fullSpaceNeeded = cardCount * cardMetrics.width + (cardCount - 1) * PLAYER_HAND_CARD_GAP;

  if (fullSpaceNeeded <= availableWidth) {
    const centeredLeft =
      PLAYER_HAND_CONTAINER_PADDING_HORIZONTAL + (availableWidth - fullSpaceNeeded) / 2;
    return { offset: baseOffset, startLeft: centeredLeft };
  }

  const offset = (availableWidth - cardMetrics.width) / (cardCount - 1);
  return {
    offset: Math.max(offset, PLAYER_HAND_MIN_VISIBLE_WIDTH),
    startLeft: PLAYER_HAND_CONTAINER_PADDING_HORIZONTAL,
  };
}
