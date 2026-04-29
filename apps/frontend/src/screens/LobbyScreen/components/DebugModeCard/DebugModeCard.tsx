/* jscpd:ignore-start */
import type { DebugMode } from '@shedding-game/shared';
import { useRouter } from 'expo-router';

import { useUpdateRoomOptionsMutation } from '@/api';
import { IconButton } from '@/components/IconButton';
import { useAppTranslation } from '@/i18n';
import { appRoutes } from '@/navigation/appRoutes';
import { DEBUG_MODES } from '@/screens/LobbyScreen/components/DebugModeList/DebugModeList.settings';

/* jscpd:ignore-end */
import { DebugModeList } from '../DebugModeList';
import { RoomOptionDetailsLayout } from '../RoomOptionDetailsLayout';

type DebugModeCardProps = {
  debugMode: DebugMode;
  roomId: string;
};

type DebugModeDetailsModalContentProps = {
  debugMode: DebugMode;
  roomId: string;
  isHostUser: boolean;
  onClose: () => void;
};

export const DebugModeCard = ({ debugMode, roomId }: DebugModeCardProps) => {
  const { t } = useAppTranslation(['rooms', 'common']);
  const router = useRouter();

  const debugIcon = debugMode === 'none' ? '👌' : '🐛';

  return (
    <IconButton
      emoji={debugIcon}
      tone={debugMode === 'none' ? 'surfaceMuted' : 'danger'}
      emojiClassName="text-[20px]"
      onPress={() => {
        router.push(appRoutes.lobbyDebugMode({ roomId }));
      }}
      accessibilityRole="button"
      accessibilityLabel={t('rooms:debugModes.configTitle')}
    />
  );
};

export const DebugModeDetailsModalContent = ({
  debugMode,
  roomId,
  isHostUser,
  onClose,
}: DebugModeDetailsModalContentProps) => {
  const { t } = useAppTranslation(['rooms', 'common']);
  const updateRoomOptionsMutation = useUpdateRoomOptionsMutation();

  const handleSelectDebugMode = async (newDebugMode: DebugMode) => {
    try {
      await updateRoomOptionsMutation.mutateAsync({
        roomId,
        debugMode: newDebugMode,
      });
      onClose();
    } catch {
      // onError in useUpdateRoomOptionsMutation handles logging; modal stays open on failure
    }
  };

  const selectedOption = DEBUG_MODES.find((o) => o.key === debugMode);
  const selectedTitle =
    selectedOption?.label ?? t(selectedOption?.labelKey ?? 'rooms:debugModes.none');

  return (
    <RoomOptionDetailsLayout
      title={t('rooms:debugModes.configTitle')}
      subtitle={t('rooms:debugModes.configSubtitle')}
      badgeEmoji={debugMode === 'none' ? '🐞' : '🐛'}
      badgeTitle={selectedTitle}
      description=""
      isHostUser={isHostUser}
      onClose={onClose}
      renderList={() => (
        <DebugModeList
          selected={debugMode}
          disabled={updateRoomOptionsMutation.isPending}
          onSelect={(mode) => void handleSelectDebugMode(mode)}
        />
      )}
    />
  );
};
