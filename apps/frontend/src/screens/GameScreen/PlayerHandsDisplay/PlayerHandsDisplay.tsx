import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { useAppTranslation } from '@/i18n';
import { surfaceEffectClassNames } from '@/theme';

import { ScrollableCardRow } from '../ScrollableCardRow/ScrollableCardRow';

import type { PlayerHandsDisplayProps } from './PlayerHandsDisplay.types';

export const PlayerHandsDisplay = function PlayerHandsDisplay({
  players,
}: PlayerHandsDisplayProps) {
  const { t } = useAppTranslation('common');
  return (
    <Box className="w-full self-stretch shrink gap-4">
      {players.map((p) => {
        const hand = Array.isArray(p.hand) ? p.hand : [];
        return (
          <Box
            key={p.id}
            className={`gap-4 rounded-[22px] border border-border-default bg-surface-card-strong px-5 py-5 ${surfaceEffectClassNames.raised}`}
          >
            <Box className="flex-row items-center justify-between gap-3">
              <Text className="flex-1 text-[18px] font-extrabold text-text-primary">{p.name}</Text>
              <Box className="rounded-full border border-border-default bg-overlay-scrim px-3 py-1.5">
                <Text className="text-[13px] font-bold uppercase tracking-[0.6px] text-text-tertiary">
                  🃏 {hand.length}
                </Text>
              </Box>
            </Box>
            {hand.length === 0 ? (
              <Box className="rounded-[16px] border border-border-action-subtle bg-overlay-success-soft px-3 py-3">
                <Text className="text-sm italic text-feedback-success">{t('labels.noCards')}</Text>
              </Box>
            ) : (
              <ScrollableCardRow
                cards={hand}
                contentContainerClassName="self-start flex-row gap-3 pr-sm"
                rowClassName="flex-row gap-3"
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
};
