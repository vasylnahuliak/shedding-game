import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { useAppTranslation } from '@/i18n';
import { surfaceEffectClassNames } from '@/theme';

import { ScrollableCardRow } from '../ScrollableCardRow/ScrollableCardRow';

import type { DiscardPileDisplayProps } from './DiscardPileDisplay.types';

export const DiscardPileDisplay = function DiscardPileDisplay({
  discardPile,
}: DiscardPileDisplayProps) {
  const { t } = useAppTranslation('game');
  // Show all cards, newest first
  const allCards = [...discardPile].reverse();

  return (
    <Box
      className={`w-full self-stretch rounded-[24px] border border-border-default bg-surface-card-strong px-5 py-5 ${surfaceEffectClassNames.raised}`}
    >
      <Text className="mb-4 text-[14px] font-bold uppercase tracking-[1.4px] text-text-tertiary">
        {t('discardPile.title', { count: discardPile.length })}
      </Text>
      {discardPile.length === 0 ? (
        <Box className="rounded-[16px] border border-border-default bg-overlay-scrim px-3 py-3">
          <Text className="text-sm italic text-text-muted">{t('discardPile.empty')}</Text>
        </Box>
      ) : (
        <ScrollableCardRow
          cards={allCards}
          contentContainerClassName="flex-row justify-start pr-sm"
        />
      )}
    </Box>
  );
};
