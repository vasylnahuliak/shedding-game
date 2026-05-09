import { View } from 'react-native';

import { SCORE_ELIMINATION_THRESHOLD } from '@shedding-game/shared';

import { Emoji } from '@/components/Emoji';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { useGameScreenStore } from '@/hooks';
import { useAuth } from '@/hooks/useAuthStore';
import { useAppTranslation } from '@/i18n';
import { badgeToneClassNames, shadowClassNames } from '@/theme';

import { useGameScreenContext } from '../GameScreenContext';

type OpponentBadgeTone = 'danger' | 'info';

const OPPONENT_CARD_BACK_OVERLAP = 17;

type OpponentBadgeProps = {
  tone: OpponentBadgeTone;
  children: React.ReactNode;
};

const opponentBadgeToneClassNames: Record<OpponentBadgeTone, string> = {
  danger: 'bg-feedback-danger',
  info: 'bg-feedback-info',
};

const OpponentBadge = ({ tone, children }: OpponentBadgeProps) => (
  <Box
    className={mergeClassNames(
      'absolute -top-[7px] z-10 rounded-[7px] px-[7px] py-[2px]',
      opponentBadgeToneClassNames[tone]
    )}
  >
    <Text className="text-[8px] font-bold text-text-primary">{children}</Text>
  </Box>
);

export const OpponentsArea = function OpponentsArea() {
  const { t } = useAppTranslation(['common', 'game']);
  const room = useGameScreenStore((state) => state.room);
  const user = useAuth((state) => state.user);
  const {
    isRoundStartAnimating,
    revealedHandCardsCountByPlayerId,
    pendingOpponentDrawCountByPlayerId,
    registerOpponentRef,
  } = useGameScreenContext();

  if (!room || !user) {
    return null;
  }

  const players = room.players;
  const currentPlayerIndex = room.currentPlayerIndex;
  const myPlayerId = user.id;
  const hideHandCards = isRoundStartAnimating;
  const myIndex = players.findIndex((p) => p.id === myPlayerId);

  const otherPlayers = [];
  for (let i = 1; i < players.length; i++) {
    const playerIndex = (myIndex + i) % players.length;
    const player = players[playerIndex];
    if (player.id !== myPlayerId) {
      otherPlayers.push(player);
    }
  }

  return (
    <Box className="self-stretch flex-row justify-center gap-2 px-1 py-1">
      {otherPlayers.map((p) => {
        const pIndex = players.findIndex((rp) => rp.id === p.id);
        const isTurn = currentPlayerIndex === pIndex;
        const cardCount = typeof p.hand === 'number' ? p.hand : p.hand.length;
        const pendingDrawCount = pendingOpponentDrawCountByPlayerId?.[p.id] ?? 0;
        const visibleCardCount = hideHandCards
          ? cardCount
          : Math.max(0, cardCount - pendingDrawCount);
        const isEliminated = p.score >= SCORE_ELIMINATION_THRESHOLD;
        const isBot = p.playerType === 'bot' || p.isLeaver;
        const opponentCardStateClassName = isEliminated
          ? mergeClassNames(badgeToneClassNames.danger, 'border-2')
          : p.isLeaver
            ? mergeClassNames(badgeToneClassNames.closedDefault, 'border-2')
            : isTurn
              ? mergeClassNames(badgeToneClassNames.accentEmphasisStrong, 'border-2')
              : badgeToneClassNames.mutedSurface;
        const opponentNameToneClassName = isEliminated
          ? 'text-text-muted line-through'
          : p.isLeaver
            ? 'italic text-text-tertiary'
            : 'text-text-primary';
        const opponentScoreToneClassName = isEliminated
          ? 'font-semibold text-feedback-danger'
          : 'text-text-secondary';

        return (
          <Box
            key={p.id}
            className={mergeClassNames(
              'min-w-0 flex-1 items-center rounded-[10px] border px-1.5 py-[7px]',
              opponentCardStateClassName,
              shadowClassNames.card
            )}
          >
            {isEliminated && (
              <OpponentBadge tone="danger">{t('common:labels.eliminatedUpper')}</OpponentBadge>
            )}
            {p.isLeaver && !isEliminated && (
              <OpponentBadge tone="info">
                {'🤖 '}
                {t('common:labels.botUpper')}
              </OpponentBadge>
            )}
            <Text
              className={mergeClassNames(
                'mb-1 w-full text-center text-[13px] font-semibold',
                opponentNameToneClassName
              )}
              numberOfLines={1}
            >
              {p.isLeaver ? `${p.name} ${t('game:opponents.leaverSuffix')}` : p.name}
            </Text>
            {!isBot && (
              <Box className="absolute right-1.5 top-1.5">
                <Emoji
                  emoji={p.isOnline === false ? '🔴' : '🟢'}
                  className="text-[10px]"
                  size={10}
                />
              </Box>
            )}
            <Text
              className={mergeClassNames(
                'mb-2 text-center text-[10px]',
                opponentScoreToneClassName
              )}
            >
              {isEliminated
                ? t('game:opponents.scoreEliminated', { count: p.score })
                : t('game:opponents.score', { count: p.score })}
            </Text>
            <View
              className="h-12 w-20 flex-row items-center justify-center"
              ref={
                registerOpponentRef ? (el: View | null) => registerOpponentRef(p.id, el) : undefined
              }
            >
              {Array.from({ length: Math.min(visibleCardCount, 7) }).map((_, i) => {
                const displayCount = Math.min(visibleCardCount, 7);
                const centerIndex = (displayCount - 1) / 2;
                const angle = (i - centerIndex) * 4;
                const translateY = Math.abs(i - centerIndex) * 1.5;
                const revealedCount = revealedHandCardsCountByPlayerId?.[p.id] ?? 0;

                return (
                  <View
                    key={i}
                    className={mergeClassNames(
                      'h-[39px] w-[26px] items-center justify-center rounded-[5px] border-2 border-border-danger bg-feedback-danger',
                      shadowClassNames.subtle
                    )}
                    style={[
                      {
                        marginLeft: i === 0 ? 0 : -OPPONENT_CARD_BACK_OVERLAP,
                        opacity: hideHandCards ? (i < revealedCount ? 1 : 0) : 1,
                        transform: [{ translateY: translateY }, { rotate: `${angle}deg` }],
                        zIndex: i,
                      },
                    ]}
                  >
                    <View className="h-[75%] w-[65%] rounded-[3px] border border-border-strong" />
                  </View>
                );
              })}
            </View>
          </Box>
        );
      })}
    </Box>
  );
};
