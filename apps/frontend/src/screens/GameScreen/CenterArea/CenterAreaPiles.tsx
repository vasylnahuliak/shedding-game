import type { ComponentProps, RefObject } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import type { Card as CardType, Suit } from '@shedding-game/shared';

import {
  GAME_CARD_DECK_SLOT_CLASS_NAME,
  GAME_CARD_FRAME_CLASS_NAME,
} from '@/components/Card/Card.settings';
import { EmojiReactionButtons } from '@/components/EmojiReactionButtons';
import { Box } from '@/components/ui/box';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { badgeToneClassNames, shadowClassNames } from '@/theme';
import { getSuitSymbol, isRedSuit } from '@/utils/card';

import { DeckShuffleAnimation } from '../DeckShuffleAnimation';

import { DiscardStack } from './DiscardStack';

type BridgeInfo = {
  handCount: number;
  pileCount: number;
  rank: string;
} | null;

type CenterAreaLayoutMetrics = {
  card: {
    borderRadius: number;
    height: number;
    width: number;
  };
  center: {
    deckCardInset: number;
  };
  reactionButtonSize: number;
};

type CenterAreaPilesProps = {
  activeSuit: Suit | null;
  bridgeHintText: string | null;
  bridgeInfo: BridgeInfo;
  deckCount: number;
  deckRef: RefObject<View | null>;
  discardPile: CardType[];
  discardPileRef: RefObject<View | null>;
  discardStackStyle: ComponentProps<typeof Animated.View>['style'];
  emptyPileText: string;
  handleShuffleComplete: () => void;
  isShuffling: boolean;
  lastCards: CardType[];
  layoutMetrics: CenterAreaLayoutMetrics;
  onToggleDiscard: () => void;
  reshuffleCount: number;
  roomId: string;
  visibleAnimatingPlayCardKeys?: Set<string>;
};

const PILE_ROW_CLASS_NAME = 'flex-row items-center self-stretch justify-between gap-2';
const SIDE_SLOT_START_CLASS_NAME = 'flex-1 min-w-14 items-start justify-center';
const SIDE_SLOT_END_CLASS_NAME = 'flex-1 min-w-14 items-end justify-center';
const DECK_SLOT_CLASS_NAME = GAME_CARD_DECK_SLOT_CLASS_NAME;
const CARD_SLOT_CLASS_NAME = GAME_CARD_FRAME_CLASS_NAME;
const DISCARD_COLUMN_CLASS_NAME = 'w-[136px] shrink-0 items-center justify-center';
const CENTERED_CONTENT_CLASS_NAME = 'items-center justify-center';
const DISCARD_STACK_VIEW_CLASS_NAME = 'relative h-[96px] w-[136px] items-center justify-center';
const FLOATING_BADGE_SLOT_CLASS_NAME = 'absolute inset-x-0 -bottom-5 items-center';
const INFO_BADGE_CLASS_NAME =
  mergeClassNames(
    'flex-row items-center gap-1 rounded-[4px] px-[7px] py-[3px]',
    badgeToneClassNames.infoSurface
  ) ?? '';
const INFO_BADGE_TEXT_CLASS_NAME = 'text-[9px] font-bold text-text-primary';
const WARNING_BADGE_CLASS_NAME = 'rounded-[4px] bg-feedback-warning px-[7px] py-[3px]';
const WARNING_BADGE_TEXT_CLASS_NAME = 'text-[9px] font-bold text-text-on-accent';
const EMPTY_PILE_TEXT_CLASS_NAME = 'text-center text-[10px] text-text-muted';
const ACTIVE_SUIT_BADGE_CLASS_NAME =
  'absolute -top-[30px] z-10 rounded-[10px] bg-surface-card-face px-2 py-[3px]';

export const CenterAreaPiles = ({
  activeSuit,
  bridgeHintText,
  bridgeInfo,
  deckCount,
  deckRef,
  discardPile,
  discardPileRef,
  discardStackStyle,
  emptyPileText,
  handleShuffleComplete,
  isShuffling,
  lastCards,
  layoutMetrics,
  onToggleDiscard,
  reshuffleCount,
  roomId,
  visibleAnimatingPlayCardKeys,
}: CenterAreaPilesProps) => {
  const { card, center } = layoutMetrics;
  const deckCardBaseStyle = {
    width: card.width,
    height: card.height,
    borderRadius: card.borderRadius,
  };

  const getDeckCardStyle = ({
    zIndex,
    top,
    left,
  }: {
    zIndex: number;
    top?: number;
    left?: number;
  }) => ({
    ...deckCardBaseStyle,
    zIndex,
    ...(top !== undefined ? { top } : {}),
    ...(left !== undefined ? { left } : {}),
  });

  const deckCardClassName =
    'absolute items-center justify-center border-2 border-border-danger bg-feedback-danger';
  const emptyPileClassName =
    mergeClassNames(
      'items-center justify-center border-2 border-dashed',
      badgeToneClassNames.mutedDefault
    ) ?? '';

  return (
    <Box className={PILE_ROW_CLASS_NAME}>
      <Box className={SIDE_SLOT_START_CLASS_NAME}>
        <View className={DECK_SLOT_CLASS_NAME} ref={deckRef}>
          {isShuffling ? (
            <DeckShuffleAnimation
              isAnimating={isShuffling}
              onAnimationComplete={handleShuffleComplete}
            />
          ) : deckCount > 0 ? (
            <>
              <View
                className={deckCardClassName}
                style={getDeckCardStyle({
                  zIndex: 1,
                  top: -center.deckCardInset * 2,
                  left: center.deckCardInset * 2,
                })}
              />
              <View
                className={deckCardClassName}
                style={getDeckCardStyle({
                  zIndex: 2,
                  top: -center.deckCardInset,
                  left: center.deckCardInset,
                })}
              />
              <View
                className={mergeClassNames(deckCardClassName, shadowClassNames.subtle)}
                style={getDeckCardStyle({ zIndex: 3 })}
              >
                <Text className="text-[15px] font-bold text-text-primary">{deckCount}</Text>
              </View>
              {reshuffleCount > 0 ? (
                <Box className={FLOATING_BADGE_SLOT_CLASS_NAME}>
                  <Box className={INFO_BADGE_CLASS_NAME}>
                    <Text className={INFO_BADGE_TEXT_CLASS_NAME}>×{reshuffleCount + 1}</Text>
                  </Box>
                </Box>
              ) : null}
            </>
          ) : (
            <View className={mergeClassNames(CARD_SLOT_CLASS_NAME, emptyPileClassName)}>
              <Text className={EMPTY_PILE_TEXT_CLASS_NAME}>{emptyPileText}</Text>
            </View>
          )}
        </View>
      </Box>

      <Box className={DISCARD_COLUMN_CLASS_NAME}>
        <Box className={CENTERED_CONTENT_CLASS_NAME}>
          {activeSuit ? (
            <Box className={mergeClassNames(ACTIVE_SUIT_BADGE_CLASS_NAME, shadowClassNames.subtle)}>
              <Text
                className={mergeClassNames(
                  'text-[14px] font-bold text-text-on-card-face',
                  isRedSuit(activeSuit) && 'text-feedback-danger'
                )}
              >
                {getSuitSymbol(activeSuit)}
              </Text>
            </Box>
          ) : null}

          <View ref={discardPileRef}>
            {lastCards.length > 0 ? (
              <Pressable onPress={onToggleDiscard}>
                <Animated.View
                  className={DISCARD_STACK_VIEW_CLASS_NAME}
                  style={[discardStackStyle]}
                >
                  <DiscardStack cards={lastCards} animatingKeys={visibleAnimatingPlayCardKeys} />
                  {bridgeInfo && bridgeHintText ? (
                    <Box className={FLOATING_BADGE_SLOT_CLASS_NAME}>
                      <Box className={WARNING_BADGE_CLASS_NAME}>
                        <Text className={WARNING_BADGE_TEXT_CLASS_NAME}>{bridgeHintText}</Text>
                      </Box>
                    </Box>
                  ) : null}
                </Animated.View>
              </Pressable>
            ) : (
              <Pressable
                className="disabled:opacity-100"
                onPress={onToggleDiscard}
                disabled={discardPile.length === 0}
              >
                <View className={mergeClassNames(CARD_SLOT_CLASS_NAME, emptyPileClassName)}>
                  <Text className={EMPTY_PILE_TEXT_CLASS_NAME}>{emptyPileText}</Text>
                </View>
              </Pressable>
            )}
          </View>
        </Box>
      </Box>

      <Box className={SIDE_SLOT_END_CLASS_NAME}>
        <EmojiReactionButtons
          roomId={roomId}
          buttonSize={layoutMetrics.reactionButtonSize}
          variant="game"
        />
      </Box>
    </Box>
  );
};
