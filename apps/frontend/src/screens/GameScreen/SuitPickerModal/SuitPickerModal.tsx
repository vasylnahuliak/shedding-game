import { ModalShell } from '@/components/Modal';
import { Box } from '@/components/ui/box';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { useAppTranslation } from '@/i18n';
import { shadowClassNames } from '@/theme';
import { getSuitSymbol, isRedSuit } from '@/utils/card';

import { useGameScreenContext } from '../GameScreenContext';

import { SUITS } from './SuitPickerModal.settings';

export const SuitPickerModal = function SuitPickerModal() {
  const { t } = useAppTranslation('game');
  const { handleSuitSelect } = useGameScreenContext();

  return (
    <ModalShell title={t('suitPicker.title')} subtitle={t('suitPicker.subtitle')}>
      <Box className="w-full max-w-[312px] self-center flex-row items-center gap-2">
        {SUITS.map((suit) => {
          const isRed = isRedSuit(suit);

          return (
            <Pressable
              key={suit}
              className={mergeClassNames(
                'h-24 min-w-0 flex-1 items-center justify-center rounded-[20px] border-2 bg-surface-card-face',
                isRed ? 'border-feedback-danger' : 'border-border-card-face',
                shadowClassNames.raised
              )}
              onPress={() => handleSuitSelect(suit)}
            >
              <Text
                className={mergeClassNames(
                  'text-[40px] font-extrabold text-text-on-card-face',
                  isRed && 'text-feedback-danger'
                )}
              >
                {getSuitSymbol(suit)}
              </Text>
            </Pressable>
          );
        })}
      </Box>
    </ModalShell>
  );
};
