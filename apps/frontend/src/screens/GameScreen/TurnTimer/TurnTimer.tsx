import { View } from 'react-native';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { formatDuration, useAppTranslation } from '@/i18n';
import { badgeToneClassNames, panelClassNames } from '@/theme';

import type { TurnTimerProps } from './TurnTimer.types';
import { useTurnTimer } from './useTurnTimer';

const timerClassNames = {
  container: 'max-w-[264px] min-h-[82px] rounded-[12px] px-[9px] py-[7px] gap-[5px]',
  header: 'gap-2.5',
  labelText: 'text-[10px]',
  valueText: 'text-xs',
  hintText: 'text-[9px] leading-[13px]',
  badge: 'px-[9px] py-1',
  badgeText: 'text-[10px]',
  pill: 'px-[9px] py-1',
  pillText: 'text-[11px]',
  titleText: 'text-xs leading-4',
  track: 'h-[5px]',
  passiveTrack: 'h-[7px]',
} as const;

export const TurnTimer = function TurnTimer({
  isActive,
  isMyTurn,
  currentPlayerName,
  gamePace,
  turnStartedAt,
}: TurnTimerProps) {
  const { t, i18n } = useAppTranslation('game');
  const { isVisible, remainingSeconds, progress, isWarning, isCritical, isExpired } = useTurnTimer({
    isActive,
    gamePace,
    turnStartedAt,
    shouldHaptics: isMyTurn,
  });

  if (!isVisible) {
    return null;
  }

  const timerFillClassName =
    isCritical || isExpired
      ? 'bg-feedback-danger'
      : isWarning
        ? 'bg-feedback-warning'
        : isMyTurn
          ? 'bg-surface-action'
          : 'bg-feedback-info';
  const timerValue = isExpired
    ? t('center.turnTimerExpired')
    : formatDuration(i18n.language, remainingSeconds);
  const hasPlayerName = Boolean(currentPlayerName?.trim());

  const passiveTitle = hasPlayerName
    ? t('center.turnTimerOtherPlayerTitle', { name: currentPlayerName?.trim() })
    : t('center.turnTimerOtherPlayerTitleFallback');
  const passiveHint = hasPlayerName
    ? t('center.turnTimerOtherPlayerHint', { name: currentPlayerName?.trim() })
    : t('center.turnTimerOtherPlayerHintFallback');
  const passiveTimerValue = isExpired
    ? t('center.turnTimerOtherPlayerExpired')
    : t('center.turnTimerOtherPlayerRemaining', {
        time: formatDuration(i18n.language, remainingSeconds),
      });
  const turnTimerHintText = t('center.turnTimerHintCompact');

  if (!isMyTurn) {
    return (
      <Box
        className={mergeClassNames(
          panelClassNames.card,
          'w-full justify-between rounded-[12px] border-overlay-info-soft',
          timerClassNames.container
        )}
      >
        <Box
          className={mergeClassNames(
            'flex-row items-center justify-between',
            timerClassNames.header
          )}
        >
          <Box
            className={mergeClassNames(
              'rounded-full border border-border-default bg-overlay-info-soft',
              timerClassNames.badge
            )}
          >
            <Text
              className={mergeClassNames('font-bold text-text-info', timerClassNames.badgeText)}
            >
              {t('center.turnTimerInfoBadge')}
            </Text>
          </Box>
          <Box
            className={mergeClassNames('rounded-full bg-surface-icon-button', timerClassNames.pill)}
          >
            <Text
              className={mergeClassNames(
                'font-bold tabular-nums text-text-secondary',
                timerClassNames.pillText
              )}
            >
              {passiveTimerValue}
            </Text>
          </Box>
        </Box>
        <Text
          className={mergeClassNames('font-bold text-text-primary', timerClassNames.titleText)}
          numberOfLines={2}
        >
          {passiveTitle}
        </Text>
        <Box
          className={mergeClassNames(
            'w-full overflow-hidden rounded-full bg-overlay-info-soft',
            timerClassNames.passiveTrack
          )}
        >
          <View
            className="h-full rounded-full bg-feedback-info"
            style={{
              width: `${progress * 100}%`,
            }}
          />
        </Box>
        <Text
          className={mergeClassNames('text-left text-text-secondary', timerClassNames.hintText)}
        >
          {passiveHint}
        </Text>
      </Box>
    );
  }

  return (
    <Box
      className={mergeClassNames(
        panelClassNames.strong,
        badgeToneClassNames.mutedSurface,
        'w-full justify-between rounded-[12px]',
        timerClassNames.container
      )}
    >
      <Box
        className={mergeClassNames('flex-row items-center justify-between', timerClassNames.header)}
      >
        <Text
          className={mergeClassNames('font-semibold text-text-tertiary', timerClassNames.labelText)}
        >
          {t('center.turnTimerTitle')}
        </Text>
        <Text
          className={mergeClassNames(
            'font-bold tabular-nums',
            timerClassNames.valueText,
            isCritical || isExpired
              ? 'text-feedback-danger'
              : isWarning
                ? 'text-feedback-warning'
                : 'text-text-action'
          )}
        >
          {timerValue}
        </Text>
      </Box>
      <Box
        className={mergeClassNames(
          'w-full overflow-hidden rounded-full bg-surface-icon-button',
          timerClassNames.track
        )}
      >
        <View
          className={mergeClassNames('h-full rounded-full', timerFillClassName)}
          style={{
            width: `${progress * 100}%`,
          }}
        />
      </Box>
      <Text
        className={mergeClassNames('text-center text-text-secondary', timerClassNames.hintText)}
      >
        {turnTimerHintText}
      </Text>
    </Box>
  );
};
