import { useRouter } from 'expo-router';

import { Box } from '@/components/ui/box';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { useGameScreenStore } from '@/hooks';
import { useAppTranslation } from '@/i18n';
import { appRoutes } from '@/navigation/appRoutes';
import { SocketService } from '@/services/SocketService';
import { badgeToneClassNames, shadowClassNames } from '@/theme';
import { showAlert } from '@/utils/alert';

import { useGameScreenContext } from '../GameScreenContext';

type HeaderIconButtonProps = {
  icon: string;
  onPress: () => void;
};

const HeaderIconButton = ({ icon, onPress }: HeaderIconButtonProps) => (
  <Pressable className="size-[35px] items-center justify-center rounded-full" onPress={onPress}>
    <Text className="text-[17px]">{icon}</Text>
  </Pressable>
);

export const GameHeader = function GameHeader() {
  const { t } = useAppTranslation(['alerts', 'common']);
  const router = useRouter();
  const room = useGameScreenStore((state) => state.room);
  const { roomId, isHost, isEliminated } = useGameScreenContext();

  if (!room) {
    return null;
  }

  const handleLeaveGame = () => {
    if (isEliminated) {
      SocketService.emit('player_leave_game', { roomId });
      return;
    }
    const message = isHost
      ? t('alerts:messages.leaveGameHost')
      : t('alerts:messages.leaveGamePlayer');
    showAlert(t('alerts:titles.leaveGameConfirm'), message, [
      { text: t('common:buttons.cancel'), style: 'cancel' },
      {
        text: t('alerts:actions.leave'),
        style: 'destructive',
        onPress: () => SocketService.emit('player_leave_game', { roomId }),
      },
    ]);
  };

  return (
    <Box
      className={mergeClassNames(
        'flex-row items-center justify-between gap-2 rounded-[10px] px-2.5 py-[7px]',
        badgeToneClassNames.mutedDefault,
        shadowClassNames.card
      )}
    >
      <Text className="min-w-0 flex-1 text-[15px] font-bold text-text-primary" numberOfLines={1}>
        {room.name}
      </Text>
      <Box className="shrink-0 flex-row gap-1.5">
        <HeaderIconButton icon="ℹ️" onPress={() => router.push(appRoutes.gameInfo({ roomId }))} />
        <HeaderIconButton icon="📚" onPress={() => router.push(appRoutes.gameRules({ roomId }))} />
        <HeaderIconButton icon="📊" onPress={() => router.push(appRoutes.gameScore({ roomId }))} />
        <HeaderIconButton icon="❌" onPress={handleLeaveGame} />
      </Box>
    </Box>
  );
};
