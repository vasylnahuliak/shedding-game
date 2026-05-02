import { useLayoutEffect, useState } from 'react';
import {
  Easing,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type { Card as CardType } from '@shedding-game/shared';

import { BRIDGE_RANKS } from '@shedding-game/shared';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { useGameScreenStore, useGameUiStore } from '@/hooks';
import { useAuth } from '@/hooks/useAuthStore';
import { useAppTranslation } from '@/i18n';
import type { User as AuthUser } from '@/services/AuthService';
import { getCardKey } from '@/utils/card';

import { useGameScreenContext } from '../GameScreenContext';
import { TurnTimer } from '../TurnTimer';

import { CenterAreaFooter } from './CenterAreaFooter';
import { CenterAreaOpeningTurnNotice } from './CenterAreaOpeningTurnNotice';
import { CenterAreaPiles } from './CenterAreaPiles';

const MAX_VISIBLE_CARDS = 4;
const EMPTY_CARDS: CardType[] = [];
const TIMER_SLOT_MIN_HEIGHT_CLASS_NAME = 'min-h-[82px]';
const CENTER_ROOT_CLASS_NAME = 'flex-1 min-h-0 self-stretch justify-between gap-2.5';
const CENTER_CONTENT_CLASS_NAME = 'flex-1 min-h-0 shrink justify-start gap-2.5';
const TURN_SECTION_CLASS_NAME = 'min-h-16 self-stretch items-center justify-center gap-1.5';
const TURN_LABEL_SLOT_CLASS_NAME = 'w-full min-h-[42px] items-center justify-center';

const getTopRankStreak = (pile: CardType[]): { rank: string; count: number } | null => {
  if (pile.length === 0) return null;

  const topRank = pile[pile.length - 1].rank;
  let count = 0;

  for (let i = pile.length - 1; i >= 0 && pile[i].rank === topRank; i--) {
    count++;
  }

  return { rank: topRank, count };
};

export const CenterArea = function CenterArea() {
  const { t } = useAppTranslation('game');
  const user = useAuth((state): AuthUser | null => state.user);
  const updateDiscardPileExpandedByDefault = useAuth(
    (state) => state.updateDiscardPileExpandedByDefault
  );
  const room = useGameScreenStore((state) => state.room);
  const selectedCards = useGameScreenStore((state) => state.selectedCards);
  const drawButtonDisabled = useGameUiStore((state) => state.drawButtonDisabled);
  const {
    roomId,
    myHand,
    isMyTurnEnabled,
    isEliminated,
    handlePlay,
    handleDraw,
    deckRef,
    discardPileRef,
    discardTopCardOffsetRef,
    visibleAnimatingPlayCardKeys,
    isShuffling,
    isRoundStartAnimating,
    handleShuffleComplete,
    layoutMetrics,
  } = useGameScreenContext();

  const discardPile = room?.discardPile ?? EMPTY_CARDS;
  const activeSuit = room?.activeSuit ?? null;
  const deckCount = room?.deck ?? 0;
  const currentPlayerName = room ? room.players[room.currentPlayerIndex]?.name || '' : '';
  const selectedCardsCount = selectedCards.length;
  const penaltyCardsCount = room?.penaltyCardsCount ?? 0;
  const hasDrawnThisTurn = room?.hasDrawnThisTurn || false;
  const playerHand = myHand;
  const reshuffleCount = room?.reshuffleCount || 0;
  const isOpeningTurn = room?.isOpeningTurn;
  const isMyTurn = isMyTurnEnabled;
  const topDiscard = discardPile.length > 0 ? discardPile[discardPile.length - 1] : null;
  const isTopSix = topDiscard?.rank === '6';
  const isTurnTimerVisible = room?.gameStatus === 'playing' && !isRoundStartAnimating;
  const showOpeningTurnNotice = Boolean(isOpeningTurn && isMyTurn);
  const shouldReserveOpeningTurnNoticeSpace = !!isOpeningTurn;
  const discardPileExpandedByDefault = user?.discardPileExpandedByDefault === true;

  const [showAllDiscard, setShowAllDiscard] = useState(discardPileExpandedByDefault);
  const [discardAnimationTick, setDiscardAnimationTick] = useState(0);
  const [previousExpandedByDefault, setPreviousExpandedByDefault] = useState(
    discardPileExpandedByDefault
  );
  const maxVisible = showAllDiscard ? MAX_VISIBLE_CARDS : 1;

  if (previousExpandedByDefault !== discardPileExpandedByDefault) {
    setPreviousExpandedByDefault(discardPileExpandedByDefault);
    setShowAllDiscard(discardPileExpandedByDefault);
  }

  const toggleAnim = useDerivedValue(() => {
    if (discardAnimationTick === 0) {
      return 1;
    }

    return withSequence(
      withTiming(0, { duration: 0 }),
      withTiming(1, {
        duration: 260,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [discardAnimationTick]);

  useLayoutEffect(
    function measureDiscardTopCardOffset() {
      if (!discardTopCardOffsetRef) {
        return;
      }

      const finalCount = Math.min(maxVisible, discardPile.length);
      const n = Math.max(finalCount - 1, 0);
      const stackWidth = layoutMetrics.card.width + n * layoutMetrics.center.stackCardOffset;
      discardTopCardOffsetRef.current =
        (layoutMetrics.center.stackTotalWidth - stackWidth) / 2 +
        n * layoutMetrics.center.stackCardOffset;
    },
    [discardPile.length, discardTopCardOffsetRef, layoutMetrics, maxVisible]
  );

  const lastCards = (() => {
    const reversed = [...discardPile].reverse();
    if (!visibleAnimatingPlayCardKeys?.size) {
      return reversed.slice(0, maxVisible);
    }

    let visible = 0;
    let count = 0;
    for (const card of reversed) {
      count++;
      if (!visibleAnimatingPlayCardKeys.has(getCardKey(card))) {
        visible++;
      }
      if (visible >= maxVisible) {
        break;
      }
    }

    return reversed.slice(0, Math.max(count, maxVisible));
  })();

  const bridgeInfo = (() => {
    if (!isMyTurn || playerHand.length === 0) {
      return null;
    }

    const streak = getTopRankStreak(discardPile);
    if (!streak) {
      return null;
    }

    if (!BRIDGE_RANKS.includes(streak.rank as (typeof BRIDGE_RANKS)[number])) {
      return null;
    }

    const matchingCards = playerHand.filter((card) => card.rank === streak.rank);
    if (matchingCards.length === 0) {
      return null;
    }

    const totalPossible = streak.count + matchingCards.length;
    if (totalPossible < 4) {
      return null;
    }

    return { rank: streak.rank, pileCount: streak.count, handCount: matchingCards.length };
  })();

  const drawButtonText = (() => {
    if (isOpeningTurn && hasDrawnThisTurn && !isTopSix) return t('center.pass');
    if (penaltyCardsCount > 0) return t('center.drawPenalty', { count: penaltyCardsCount });
    if (hasDrawnThisTurn && !isTopSix) return t('center.pass');
    if (isTopSix) return t('center.drawMore');
    return t('center.draw');
  })();

  const discardStackStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotateY: `${interpolate(toggleAnim.value, [0, 1], [20, 0])}deg`,
      },
      {
        scale: interpolate(toggleAnim.value, [0, 1], [0.98, 1]),
      },
    ],
  }));

  const handleToggleDiscard = () => {
    const nextShowAllDiscard = !showAllDiscard;

    setDiscardAnimationTick((previous) => previous + 1);
    setShowAllDiscard(nextShowAllDiscard);

    if (!user || nextShowAllDiscard === discardPileExpandedByDefault) {
      return;
    }

    void updateDiscardPileExpandedByDefault(nextShowAllDiscard).catch(() => {
      // Keep the in-game toggle responsive even if saving the preference fails.
    });
  };

  const openingTurnText = isTopSix
    ? t('center.openingCompact.topSix')
    : topDiscard?.rank === '7'
      ? t('center.openingCompact.topSeven')
      : t('center.openingCompact.default');
  const bridgeHintText = bridgeInfo
    ? t('center.bridgeHint', {
        pileCount: bridgeInfo.pileCount,
        handCount: bridgeInfo.handCount,
      })
    : null;

  const isDrawDisabled = isEliminated || !isMyTurn || selectedCardsCount > 0 || drawButtonDisabled;
  const isPlayDisabled = isEliminated || !isMyTurn || selectedCardsCount === 0;
  const showActionButtons = isMyTurn && !isEliminated;
  const turnStatusTextClassName = isMyTurn
    ? 'text-center text-[16px] leading-[21px] font-bold text-text-accent text-shadow-subtle'
    : 'text-center text-[14px] leading-[19px] font-medium text-text-secondary';
  const playButtonText =
    selectedCardsCount > 0
      ? t('center.playWithCount', { count: selectedCardsCount })
      : t('center.play');

  return (
    <Box className={CENTER_ROOT_CLASS_NAME}>
      <Box className={CENTER_CONTENT_CLASS_NAME}>
        <Box className={TURN_SECTION_CLASS_NAME}>
          <Box className={TURN_LABEL_SLOT_CLASS_NAME}>
            <Text className={turnStatusTextClassName} numberOfLines={2}>
              {isMyTurn
                ? t('center.yourTurn')
                : t('center.currentTurn', { name: currentPlayerName })}
            </Text>
          </Box>

          <Box
            className={mergeClassNames(
              'w-full items-center justify-center',
              TIMER_SLOT_MIN_HEIGHT_CLASS_NAME
            )}
          >
            {isTurnTimerVisible ? (
              <TurnTimer
                isActive={room?.gameStatus === 'playing'}
                isMyTurn={isMyTurn}
                currentPlayerName={currentPlayerName}
                gamePace={room?.gamePace ?? 'quick'}
                turnStartedAt={room?.turnStartedAt ?? null}
              />
            ) : null}
          </Box>
        </Box>
        <CenterAreaPiles
          activeSuit={activeSuit}
          bridgeHintText={bridgeHintText}
          bridgeInfo={bridgeInfo}
          deckCount={deckCount}
          deckRef={deckRef}
          discardPile={discardPile}
          discardPileRef={discardPileRef}
          discardStackStyle={discardStackStyle}
          emptyPileText={t('center.emptyPile')}
          handleShuffleComplete={handleShuffleComplete}
          isShuffling={isShuffling}
          lastCards={lastCards}
          layoutMetrics={layoutMetrics}
          onToggleDiscard={handleToggleDiscard}
          reshuffleCount={reshuffleCount}
          roomId={roomId}
          visibleAnimatingPlayCardKeys={visibleAnimatingPlayCardKeys}
        />
      </Box>
      <CenterAreaOpeningTurnNotice
        openingTurnText={openingTurnText}
        showOpeningTurnNotice={showOpeningTurnNotice}
        shouldReserveOpeningTurnNoticeSpace={shouldReserveOpeningTurnNoticeSpace}
      />
      <CenterAreaFooter
        drawButtonText={drawButtonText}
        handleDraw={handleDraw}
        handlePlay={handlePlay}
        isDrawDisabled={isDrawDisabled}
        isPlayDisabled={isPlayDisabled}
        isTopSix={isTopSix}
        playButtonText={playButtonText}
        showActionButtons={showActionButtons}
      />
    </Box>
  );
};
