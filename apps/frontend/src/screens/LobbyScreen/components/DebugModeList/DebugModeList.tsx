import { Box } from '@/components/ui/box';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { useAppTranslation } from '@/i18n';
import { badgeToneClassNames, panelClassNames } from '@/theme';

import { DEBUG_MODES } from './DebugModeList.settings';
import type { DebugModeListProps } from './DebugModeList.types';

export const DebugModeList = ({ selected, onSelect, disabled = false }: DebugModeListProps) => {
  const { t } = useAppTranslation('rooms');
  return (
    <Box className="flex-row flex-wrap gap-1.5 mb-2">
      {DEBUG_MODES.map(({ key, label, labelKey }) => (
        <Pressable
          key={key}
          className={mergeClassNames(
            panelClassNames.strong,
            'rounded-[5px] p-3',
            selected === key && badgeToneClassNames.infoSurface
          )}
          disabled={disabled}
          onPress={() => {
            onSelect(key);
          }}
        >
          <Text className="text-sm text-text-primary">{labelKey ? t(labelKey) : label}</Text>
        </Pressable>
      ))}
    </Box>
  );
};
