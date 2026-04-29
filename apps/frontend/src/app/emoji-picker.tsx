import { EmojiPickerModal } from '@/components/EmojiPickerModal';
import { ModalRouteFrame } from '@/components/ModalRouteFrame';
import { useEmojiReactionStore } from '@/hooks';
import { useAuth } from '@/hooks/useAuthStore';
import { useAppTranslation } from '@/i18n';
import { appRoutes } from '@/navigation/appRoutes';
import { useModalDismiss } from '@/navigation/useModalDismiss';
import { getReactionEmoji } from '@/shared/emoji';
import { showAlert } from '@/utils/alert';

export default function EmojiPickerRoute() {
  const { t } = useAppTranslation(['alerts']);
  const dismiss = useModalDismiss(appRoutes.home);
  const user = useAuth((state) => state.user);
  const updateEmojiPreference = useAuth((state) => state.updateEmojiPreference);
  const editingReactionType = useEmojiReactionStore((state) => state.editingReactionType);
  const closeEmojiPicker = useEmojiReactionStore((state) => state.closeEmojiPicker);

  const currentEmoji = editingReactionType
    ? getReactionEmoji(editingReactionType, user?.emojiPreferences)
    : undefined;

  const handleClose = () => {
    closeEmojiPicker();
    dismiss();
  };

  const handleEmojiSelect = async (emoji: string) => {
    if (editingReactionType) {
      try {
        await updateEmojiPreference(editingReactionType, emoji);
      } catch {
        showAlert(t('alerts:titles.error'), t('alerts:messages.emojiSaveFailed'));
      }
    }
  };

  return (
    <ModalRouteFrame onRequestClose={handleClose}>
      <EmojiPickerModal
        reactionType={editingReactionType}
        currentEmoji={currentEmoji}
        onSelect={handleEmojiSelect}
        onClose={handleClose}
      />
    </ModalRouteFrame>
  );
}
