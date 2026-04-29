import type { RoomDetails } from '@/types/rooms';
import { measureInWindowAsync } from '@/utils/measureInWindow';

import {
  OPPONENT_PLAY_DURATION,
  PLAY_ANIMATION_DURATION,
} from '../CardAnimationLayer/CardAnimationLayer.settings';
import type { GameLayoutMetrics } from '../gameLayout';

import { measureDiscardTarget } from './animationMeasurement';
import type { AnimationLayerRef, NumberRef, OpponentRefsRef, ViewRef } from './cardAnimationRefs';

type AnimateOpeningCardToDiscardParams = {
  updatedRoom: RoomDetails;
  userId: string | undefined;
  onComplete?: () => void;
  animationLayerRef: AnimationLayerRef;
  gameWrapperRef: ViewRef;
  discardPileRef: ViewRef;
  discardTopCardOffsetRef: NumberRef;
  handContainerRef: ViewRef;
  opponentRefs: OpponentRefsRef;
  layoutMetrics: GameLayoutMetrics;
};

export const animateOpeningCardToDiscard = ({
  updatedRoom,
  userId,
  onComplete,
  animationLayerRef,
  gameWrapperRef,
  discardPileRef,
  discardTopCardOffsetRef,
  handContainerRef,
  opponentRefs,
  layoutMetrics,
}: AnimateOpeningCardToDiscardParams) => {
  if (!userId || updatedRoom.discardPile.length === 0) {
    onComplete?.();
    return 0;
  }

  const openingCard = updatedRoom.discardPile[updatedRoom.discardPile.length - 1];
  const starter = updatedRoom.players[updatedRoom.currentPlayerIndex];
  if (!starter) {
    onComplete?.();
    return 0;
  }

  const animationLayer = animationLayerRef.current;
  if (!animationLayer) {
    onComplete?.();
    return 0;
  }

  const isMyOpeningCard = starter.id === userId;
  const duration = isMyOpeningCard ? PLAY_ANIMATION_DURATION : OPPONENT_PLAY_DURATION;

  void (async () => {
    try {
      const { wrapperPos, toX, toY } = await measureDiscardTarget(
        gameWrapperRef,
        discardPileRef,
        discardTopCardOffsetRef.current ?? 0,
        layoutMetrics.card
      );

      if (isMyOpeningCard) {
        const handPos = await measureInWindowAsync(handContainerRef);
        animationLayer.animatePlayCard({
          card: openingCard,
          fromX: handPos.x - wrapperPos.x + (handPos.w - layoutMetrics.card.width) / 2,
          fromY: handPos.y - wrapperPos.y,
          toX,
          toY,
          onComplete,
        });
        return;
      }

      const starterRef = opponentRefs.current.get(starter.id);
      if (!starterRef) {
        onComplete?.();
        return;
      }

      const starterPos = await measureInWindowAsync({ current: starterRef });
      animationLayer.animateOpponentPlayCard({
        card: openingCard,
        fromX: starterPos.x - wrapperPos.x + (starterPos.w - layoutMetrics.card.width) / 2,
        fromY: starterPos.y - wrapperPos.y + (starterPos.h - layoutMetrics.card.height) / 2,
        toX,
        toY,
        onComplete,
      });
    } catch {
      onComplete?.();
    }
  })();

  return duration;
};
