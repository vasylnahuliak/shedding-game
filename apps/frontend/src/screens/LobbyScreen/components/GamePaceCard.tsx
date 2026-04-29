/* jscpd:ignore-start */
import type { GamePace } from '@shedding-game/shared';
import { useRouter } from 'expo-router';

import { useUpdateRoomOptionsMutation } from '@/api';
import { IconButton } from '@/components/IconButton';
import { useAppTranslation } from '@/i18n';
import { appRoutes } from '@/navigation/appRoutes';
import { GAME_PACE_EMOJIS, getGamePaceCopy, getGamePaceDescription } from '@/utils/gamePace';

/* jscpd:ignore-end */
import { GamePaceList } from './GamePaceList';
import { RoomOptionDetailsLayout } from './RoomOptionDetailsLayout';

type GamePaceCardProps = {
  gamePace: GamePace;
  roomId: string;
};

type GamePaceDetailsModalContentProps = {
  gamePace: GamePace;
  roomId: string;
  isHostUser: boolean;
  onClose: () => void;
};

export const GamePaceCard = ({ gamePace, roomId }: GamePaceCardProps) => {
  const { t } = useAppTranslation(['rooms', 'common']);
  const router = useRouter();
  const gamePaceCopy = getGamePaceCopy(gamePace);
  const gamePaceTitle = t(gamePaceCopy.titleKey);

  return (
    <IconButton
      emoji={GAME_PACE_EMOJIS[gamePace]}
      tone="accent"
      emojiClassName="text-[20px]"
      onPress={() => {
        router.push(appRoutes.lobbyGamePace({ roomId }));
      }}
      accessibilityRole="button"
      accessibilityLabel={t('rooms:gamePaceDetails.openLabel', {
        pace: gamePaceTitle,
      })}
    />
  );
};

export const GamePaceDetailsModalContent = ({
  gamePace,
  roomId,
  isHostUser,
  onClose,
}: GamePaceDetailsModalContentProps) => {
  const { t, i18n } = useAppTranslation(['rooms', 'common']);
  const updateRoomOptionsMutation = useUpdateRoomOptionsMutation();
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const gamePaceCopy = getGamePaceCopy(gamePace);
  const gamePaceTitle = t(gamePaceCopy.titleKey);
  const description = getGamePaceDescription(locale, gamePace, t);

  const handleSelectGamePace = async (newGamePace: GamePace) => {
    try {
      await updateRoomOptionsMutation.mutateAsync({
        roomId,
        gamePace: newGamePace,
      });
      onClose();
    } catch {
      // onError in useUpdateRoomOptionsMutation handles logging; modal stays open on failure
    }
  };

  return (
    <RoomOptionDetailsLayout
      title={t('gamePaceDetails.roomTitle')}
      subtitle={t('gamePaceDetails.roomSubtitle')}
      badgeEmoji={GAME_PACE_EMOJIS[gamePace]}
      badgeTitle={gamePaceTitle}
      description={description ?? ''}
      isHostUser={isHostUser}
      onClose={onClose}
      renderList={() => (
        <GamePaceList
          selected={gamePace}
          disabled={updateRoomOptionsMutation.isPending}
          onSelect={(pace: GamePace) => void handleSelectGamePace(pace)}
        />
      )}
    />
  );
};
