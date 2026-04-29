import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';

import { IconButton } from '@/components/IconButton';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { useAppTranslation } from '@/i18n';

type GameFiltersButtonProps = {
  activeFiltersCount: number;
  href: Href;
};

export const GameFiltersButton = function GameFiltersButton({
  activeFiltersCount,
  href,
}: GameFiltersButtonProps) {
  const { t } = useAppTranslation('admin');
  const router = useRouter();

  return (
    <Box className="relative h-[44px] w-[44px] items-center justify-center">
      <IconButton
        emoji="🔍"
        tone={activeFiltersCount > 0 ? 'accent' : 'surfaceMuted'}
        size="lg"
        onPress={() => router.push(href)}
        accessibilityLabel={t('filters.openA11y')}
        accessibilityRole="button"
      />
      {activeFiltersCount > 0 && (
        <Box
          className="absolute right-[1px] top-[1px] h-[18px] min-w-[18px] items-center justify-center rounded-full bg-text-accent px-1"
          pointerEvents="none"
        >
          <Text className="text-[11px] font-bold text-text-on-accent">{activeFiltersCount}</Text>
        </Box>
      )}
    </Box>
  );
};
