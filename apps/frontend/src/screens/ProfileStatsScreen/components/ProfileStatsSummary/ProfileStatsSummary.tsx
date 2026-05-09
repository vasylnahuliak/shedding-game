import type { UserStats } from '@shedding-game/shared';

import { Emoji } from '@/components/Emoji';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { useAppTranslation } from '@/i18n';
import {
  badgeBaseClassNames,
  badgeTextToneClassNames,
  badgeToneClassNames,
  panelClassNames,
} from '@/theme';

type StatKey = keyof Pick<UserStats, 'gamesPlayed' | 'losses' | 'wins'>;
type StatLabelKey = 'statistics.gamesPlayed' | 'statistics.losses' | 'statistics.wins';

type StatRowDefinition = {
  containerClassName: string;
  key: StatKey;
  emoji: string;
  labelKey: StatLabelKey;
  valueClassName: string;
};

type ProfileStatsSummaryProps = {
  stats: UserStats;
};

const STAT_ROW_DEFINITIONS: readonly StatRowDefinition[] = [
  {
    containerClassName: badgeToneClassNames.strongDefault,
    key: 'gamesPlayed',
    emoji: '🎮',
    labelKey: 'statistics.gamesPlayed',
    valueClassName: badgeTextToneClassNames.primary,
  },
  {
    containerClassName: badgeToneClassNames.action,
    key: 'wins',
    emoji: '🏆',
    labelKey: 'statistics.wins',
    valueClassName: badgeTextToneClassNames.action,
  },
  {
    containerClassName: badgeToneClassNames.danger,
    key: 'losses',
    emoji: '💀',
    labelKey: 'statistics.losses',
    valueClassName: badgeTextToneClassNames.danger,
  },
];

const getWinRate = ({ gamesPlayed, wins }: UserStats) => {
  if (gamesPlayed === 0) {
    return 0;
  }

  return Math.round((wins / gamesPlayed) * 100);
};

export const ProfileStatsSummary = function ProfileStatsSummary({
  stats,
}: ProfileStatsSummaryProps) {
  const { t } = useAppTranslation('rooms');
  const winRate = getWinRate(stats);

  return (
    <Box className="gap-3">
      {STAT_ROW_DEFINITIONS.map(({ containerClassName, key, emoji, labelKey, valueClassName }) => (
        <Box
          key={key}
          className={mergeClassNames(
            panelClassNames.strong,
            'flex-row items-center gap-3 px-4 py-3',
            containerClassName
          )}
        >
          <Box className={mergeClassNames(badgeBaseClassNames.icon, badgeToneClassNames.neutral)}>
            <Emoji emoji={emoji} className="text-[20px]" size={20} />
          </Box>
          <Text className="flex-1 text-[15px] font-semibold text-text-secondary">
            {t(labelKey)}
          </Text>
          <Text
            className={mergeClassNames('text-[24px] font-extrabold', valueClassName)}
            style={{ fontVariant: ['tabular-nums'] }}
            selectable
          >
            {stats[key]}
          </Text>
        </Box>
      ))}

      <Box
        className={mergeClassNames(
          panelClassNames.strong,
          'items-center rounded-[24px] px-4 py-4',
          badgeToneClassNames.accent
        )}
      >
        <Text
          className={mergeClassNames(
            'text-[13px] font-bold uppercase tracking-[0.8px]',
            badgeTextToneClassNames.neutral
          )}
        >
          {t('statistics.winRate')}
        </Text>
        <Text
          className={mergeClassNames(
            'mt-1 text-[30px] font-extrabold',
            badgeTextToneClassNames.accent
          )}
          style={{ fontVariant: ['tabular-nums'] }}
          selectable
        >
          {winRate}%
        </Text>
      </Box>
    </Box>
  );
};
