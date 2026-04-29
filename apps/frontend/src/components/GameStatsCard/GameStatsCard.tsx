import type { AppLocale } from '@shedding-game/shared';

import { resolveAppLocale } from '@shedding-game/shared';

import { CardListItem } from '@/components/CardListItem';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { formatDateTime, formatDuration, useAppTranslation } from '@/i18n';
import { translateBackendMessage } from '@/i18n/backendMessages';
import {
  badgeBaseClassNames,
  badgeTextToneClassNames,
  badgeToneClassNames,
  panelClassNames,
} from '@/theme';

import type { GameStatsCardProps } from './GameStatsCard.types';
import { getGameStatsStatusLabelKey } from './GameStatsCard.utils';

const getStatusToneClassNames = ({ gameStatus, isClosed }: GameStatsCardProps['game']) => {
  if (isClosed) {
    return {
      container: badgeToneClassNames.neutral,
      text: badgeTextToneClassNames.neutral,
    };
  }

  switch (gameStatus) {
    case 'waiting':
      return {
        container: badgeToneClassNames.accent,
        text: badgeTextToneClassNames.accent,
      };
    case 'playing':
      return {
        container: badgeToneClassNames.action,
        text: badgeTextToneClassNames.action,
      };
    case 'round_over':
      return {
        container: badgeToneClassNames.strongDefault,
        text: badgeTextToneClassNames.neutral,
      };
    case 'finished':
      return {
        container: badgeToneClassNames.strongDefault,
        text: badgeTextToneClassNames.neutral,
      };
  }
};

export const GameStatsCard = function GameStatsCard({ game }: GameStatsCardProps) {
  const { t, i18n } = useAppTranslation('admin');
  const locale: AppLocale = resolveAppLocale(i18n.language);
  const statusLabel = t(getGameStatsStatusLabelKey(game.gameStatus, game.isClosed));
  const statusToneClassNames = getStatusToneClassNames(game);
  const details = [
    game.createdAt ? t('card.createdAt', { value: formatDateTime(locale, game.createdAt) }) : null,
    game.gameStartedAt
      ? t('card.startedAt', { value: formatDateTime(locale, game.gameStartedAt) })
      : null,
    game.isClosed && game.closedAt
      ? t('card.closedAt', { value: formatDateTime(locale, game.closedAt) })
      : null,
    game.gameStartedAt && game.gameFinishedAt
      ? t('card.duration', {
          value:
            game.gameFinishedAt >= game.gameStartedAt
              ? formatDuration(
                  locale,
                  Math.floor((game.gameFinishedAt - game.gameStartedAt) / 1000)
                )
              : t('card.noWinner'),
        })
      : null,
  ].filter((detail): detail is string => detail != null);
  const winnerName =
    game.players.find((player) => player.id === game.winnerId)?.name ?? t('card.noWinner');
  const closedReason =
    game.isClosed && game.closedReasonCode
      ? translateBackendMessage(
          {
            code: game.closedReasonCode,
            params: game.closedReasonParams,
          },
          ''
        )
      : null;

  return (
    <CardListItem className={game.isClosed ? badgeToneClassNames.mutedSurface : undefined}>
      <Box className="min-w-0 flex-1 gap-3">
        <Box className="gap-2.5">
          <Box className="flex-row items-start justify-between gap-3">
            <Text
              className="flex-1 text-[18px] font-extrabold text-text-primary"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {game.name}
            </Text>
            <Box
              className={mergeClassNames(
                badgeBaseClassNames.pillLabel,
                statusToneClassNames.container
              )}
            >
              <Text className={mergeClassNames('text-[12px] font-bold', statusToneClassNames.text)}>
                {statusLabel}
              </Text>
            </Box>
          </Box>

          <Box className="flex-row flex-wrap items-center gap-2">
            <Box
              className={mergeClassNames(
                badgeBaseClassNames.pillLabel,
                badgeToneClassNames.strongDefault
              )}
            >
              <Text
                className={mergeClassNames(
                  'text-[12px] font-bold',
                  badgeTextToneClassNames.neutral
                )}
              >
                {t('card.playersCount', { count: game.playersCount })}
              </Text>
            </Box>
            {typeof game.roundsPlayed === 'number' && game.roundsPlayed > 0 ? (
              <Box
                className={mergeClassNames(
                  badgeBaseClassNames.pillLabel,
                  badgeToneClassNames.strongDefault
                )}
              >
                <Text
                  className={mergeClassNames(
                    'text-[12px] font-bold',
                    badgeTextToneClassNames.neutral
                  )}
                >
                  {t('card.rounds', { count: game.roundsPlayed })}
                </Text>
              </Box>
            ) : null}
          </Box>
        </Box>

        {details.length > 0 ? (
          <Box className="gap-1 rounded-[18px] bg-surface-card-strong px-4 py-3">
            {details.map((detail, index) => (
              <Text
                key={`${game.id}-detail-${index + 1}`}
                className="text-[12px] text-text-tertiary"
              >
                {detail}
              </Text>
            ))}
          </Box>
        ) : null}

        {closedReason ? (
          <Box className="rounded-[18px] bg-overlay-scrim px-4 py-3">
            <Text className="text-[13px] italic leading-5 text-text-secondary">{closedReason}</Text>
          </Box>
        ) : null}

        {game.winnerId ? (
          <Box
            className={mergeClassNames(
              panelClassNames.strong,
              'rounded-[18px] px-4 py-3',
              badgeToneClassNames.action
            )}
          >
            <Text className="text-[13px] font-bold text-text-primary">
              {t('card.winner', { name: winnerName })}
            </Text>
          </Box>
        ) : null}

        <Box className="flex-row flex-wrap gap-2 border-t border-t-border-subtle pt-3">
          {game.players.map((player) => {
            const showScore = typeof game.roundsPlayed === 'number' && game.roundsPlayed > 0;
            const roundScore = game.lastRoundScores?.find((entry) => entry.playerId === player.id);
            const scoreLabel = !showScore
              ? null
              : roundScore !== undefined
                ? `${roundScore.scoreChange >= 0 ? '+' : ''}${String(roundScore.scoreChange)} → ${String(roundScore.totalScore)}`
                : player.score !== undefined
                  ? t('card.points', { count: player.score })
                  : null;

            return (
              <Box
                key={player.id}
                className={mergeClassNames(
                  'rounded-full px-3 py-2',
                  badgeToneClassNames.strongDefault
                )}
              >
                <Text className="text-[13px] font-semibold text-text-primary">
                  {player.isHost ? '👑 ' : ''}
                  {player.name}
                  {scoreLabel != null ? (
                    <Text className="text-[12px] font-medium text-text-tertiary">
                      {' '}
                      • {scoreLabel}
                    </Text>
                  ) : null}
                </Text>
              </Box>
            );
          })}
        </Box>
      </Box>
    </CardListItem>
  );
};
