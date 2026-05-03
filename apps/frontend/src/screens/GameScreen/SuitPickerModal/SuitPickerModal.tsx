import { SuitGlyph } from '@/components/Card';
import { ModalShell } from '@/components/Modal';
import { Box } from '@/components/ui/box';
import { Pressable } from '@/components/ui/pressable';
import { mergeClassNames } from '@/components/ui/utils';
import { useAuth } from '@/hooks/useAuthStore';
import { useAppTranslation } from '@/i18n';
import { shadowClassNames } from '@/theme';

import { useGameScreenContext } from '../GameScreenContext';

import { SUITS } from './SuitPickerModal.settings';

export const SuitPickerModal = function SuitPickerModal() {
  const { t } = useAppTranslation('game');
  const { handleSuitSelect } = useGameScreenContext();
  const suitDisplayMode = useAuth((state) => state.user?.suitDisplayMode);

  return (
    <ModalShell title={t('suitPicker.title')} subtitle={t('suitPicker.subtitle')}>
      <Box className="w-full max-w-[312px] self-center flex-row items-center gap-2">
        {SUITS.map((suit) => {
          return (
            <Pressable
              key={suit}
              className={mergeClassNames(
                'h-24 min-w-0 flex-1 items-center justify-center rounded-[20px] bg-surface-card-face',
                shadowClassNames.raised
              )}
              onPress={() => handleSuitSelect(suit)}
            >
              <SuitGlyph
                className="text-[40px] font-extrabold text-text-on-card-face"
                suit={suit}
                suitDisplayMode={suitDisplayMode}
              />
            </Pressable>
          );
        })}
      </Box>
    </ModalShell>
  );
};
