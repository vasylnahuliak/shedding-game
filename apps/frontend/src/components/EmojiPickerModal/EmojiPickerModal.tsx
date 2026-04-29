import { Pressable } from 'react-native';

import type { ReactionType } from '@shedding-game/shared';

import { POPULAR_EMOJIS } from '@shedding-game/shared';

import { ModalShell } from '@/components/Modal';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { useAppTranslation } from '@/i18n';
import { surfaceEffectClassNames } from '@/theme';

interface EmojiPickerModalProps {
  reactionType: ReactionType | null;
  currentEmoji?: string;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export const EmojiPickerModal = function EmojiPickerModal({
  currentEmoji,
  onSelect,
  onClose,
}: EmojiPickerModalProps) {
  const { t } = useAppTranslation('common');

  const handleEmojiSelect = (emoji: string) => {
    onSelect(emoji);
    onClose();
  };

  return (
    <ModalShell
      title={t('emojiPicker.title')}
      subtitle={t('emojiPicker.subtitle')}
      onClose={onClose}
    >
      <Box className="mb-xs flex-row flex-wrap justify-center gap-sm">
        {POPULAR_EMOJIS.map((emoji) => (
          <Pressable
            key={emoji}
            className={`h-12 w-12 items-center justify-center ${currentEmoji === emoji ? `rounded-xl border border-border-accent bg-surface-card-strong ${surfaceEffectClassNames.card}` : 'bg-transparent'}`}
            onPress={() => handleEmojiSelect(emoji)}
          >
            <Text className="text-2xl">{emoji}</Text>
          </Pressable>
        ))}
      </Box>
    </ModalShell>
  );
};
