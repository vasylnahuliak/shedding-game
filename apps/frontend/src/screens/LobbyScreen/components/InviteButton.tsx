import { Share } from 'react-native';

import { useRoomInviteLinkMutation } from '@/api';
import { IconButton } from '@/components/IconButton';
import { useAppTranslation } from '@/i18n';
import { LoggingService } from '@/services/LoggingService';
import { showErrorAlert } from '@/utils/alert';

interface InviteButtonProps {
  roomId: string;
}

export const InviteButton = ({ roomId }: InviteButtonProps) => {
  const { t } = useAppTranslation(['alerts', 'lobby']);
  const inviteLinkMutation = useRoomInviteLinkMutation();

  const shareInviteUrl = async (inviteUrl: string) => {
    try {
      await Share.share({ message: t('lobby:invite.shareMessage', { url: inviteUrl }) });
    } catch {}
  };

  const handlePress = async () => {
    try {
      const inviteLink = await inviteLinkMutation.mutateAsync(roomId);
      await shareInviteUrl(inviteLink.shortUrl);
    } catch (error) {
      LoggingService.warn('Failed to create Smler invite link', {
        roomId,
        error: error instanceof Error ? error.message : String(error),
      });
      showErrorAlert(t('alerts:titles.error'), t('alerts:messages.lobbyJoinFailed'));
    }
  };

  return (
    <IconButton
      emoji={inviteLinkMutation.isPending ? '…' : '🔗'}
      tone="surfaceMuted"
      className={inviteLinkMutation.isPending ? 'opacity-60' : ''}
      emojiClassName="text-[18px]"
      onPress={handlePress}
      disabled={inviteLinkMutation.isPending}
    />
  );
};
