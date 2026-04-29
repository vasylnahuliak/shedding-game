/* jscpd:ignore-start */
import { Pressable } from 'react-native';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { useAppTranslation } from '@/i18n';
import {
  badgeBaseClassNames,
  badgeTextToneClassNames,
  badgeToneClassNames,
  panelClassNames,
  surfaceEffectClassNames,
} from '@/theme';
/* jscpd:ignore-end */

interface EmptySlotProps {
  label?: string;
  showAddBotAction?: boolean;
  addBotDisabled?: boolean;
  onAddBot?: () => void;
}

export const EmptySlot = ({
  label,
  showAddBotAction = false,
  addBotDisabled = false,
  onAddBot,
}: EmptySlotProps) => {
  const { t } = useAppTranslation('lobby');
  const resolvedLabel = label ?? t('emptySlot.label');

  return (
    <Box
      className={mergeClassNames(
        panelClassNames.subtle,
        'flex-row items-center justify-between gap-3 px-4 py-3'
      )}
      style={{ borderStyle: 'dashed' }}
    >
      <Box className="min-w-0 flex-1 flex-row items-center gap-3">
        <Box className="h-12 w-12 items-center justify-center rounded-[18px] bg-surface-card-muted">
          <Text className="text-[20px] font-semibold text-text-muted">?</Text>
        </Box>
        <Box className="min-w-0 flex-1">
          <Text className="text-[15px] font-semibold italic leading-5 text-text-secondary">
            {resolvedLabel}
          </Text>
        </Box>
      </Box>
      {showAddBotAction ? (
        <Pressable
          className={mergeClassNames(
            badgeBaseClassNames.chip,
            badgeToneClassNames.action,
            'min-h-[36px] self-start items-center justify-center px-3',
            addBotDisabled && 'opacity-50',
            surfaceEffectClassNames.card
          )}
          onPress={onAddBot}
          disabled={addBotDisabled}
          accessibilityLabel={t('actions.addBot')}
        >
          <Text
            className={mergeClassNames(
              'text-center text-[12px] font-extrabold leading-none',
              badgeTextToneClassNames.action
            )}
          >
            + {t('playerCard.bot')}
          </Text>
        </Pressable>
      ) : null}
    </Box>
  );
};
