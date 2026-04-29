import { Pressable } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  useActiveGameQuery,
  useCreateRoomMutation,
  useJoinRoomMutation,
  useRoomsQuery,
} from '@/api';
import { IconButton } from '@/components/IconButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { useAppTranslation } from '@/i18n';
import { translateBackendMessage } from '@/i18n/backendMessages';
import { appRoutes } from '@/navigation/appRoutes';
import { HTTPError } from '@/services';
import { analytics } from '@/services/analytics';
import { readHttpErrorBody } from '@/services/httpError';
import { badgeToneClassNames, surfaceEffectClassNames } from '@/theme';
import { showErrorAlert } from '@/utils/alert';

import { RoomList } from './components/RoomList';
import { useRoomInactiveNotice } from './useRoomInactiveNotice';
import { useRoomsLiveSync } from './useRoomsLiveSync';
import { useRoomsScreenActions } from './useRoomsScreenActions';

type ApiErrorBody = {
  code?: string;
  message?: string;
  params?: Record<string, string | number>;
};

export const RoomsScreen = () => {
  const { t } = useAppTranslation(['rooms', 'alerts', 'common']);
  const { notice, noticeDetail, noticeAt } = useLocalSearchParams<{
    notice?: string | string[];
    noticeDetail?: string | string[];
    noticeAt?: string | string[];
  }>();
  const router = useRouter();

  const { data: rooms = [], isLoading: isRoomsLoading, refetch: refetchRooms } = useRoomsQuery();
  const { data: activeGame = null, refetch: refetchActiveGame } = useActiveGameQuery();
  const joinRoomMutation = useJoinRoomMutation();
  const createRoomMutation = useCreateRoomMutation();
  const hasCurrentRoom = rooms.some((room) => room.isCurrentUserInRoom);
  const canCreateRoom = !activeGame && !hasCurrentRoom;

  const loading = isRoomsLoading || joinRoomMutation.isPending;

  const { refreshing, refreshRooms, joinRoom, returnToGame } = useRoomsScreenActions({
    joinRoomMutation,
    refetchRooms,
    refetchActiveGame,
  });

  useRoomsLiveSync({
    refetchRooms,
    refetchActiveGame,
  });

  useRoomInactiveNotice({
    notice,
    noticeDetail,
    noticeAt,
  });

  const openProfile = () => {
    router.push(appRoutes.profile);
  };

  const handleCreateRoom = async () => {
    try {
      const room = await createRoomMutation.mutateAsync({ name: '' });
      analytics.track('lobby_created', { name: room.name });
      router.push(appRoutes.lobby({ roomId: room.id }));
    } catch (error: unknown) {
      const message =
        error instanceof HTTPError
          ? translateBackendMessage(
              await readHttpErrorBody<ApiErrorBody>(error),
              t('alerts:messages.roomCreateFailed')
            )
          : t('alerts:messages.roomCreateFailed');
      showErrorAlert(t('alerts:titles.error'), message);
    }
  };

  return (
    <ScreenContainer edges={['top', 'bottom']} contentClassName="px-5 pt-2 pb-3.5">
      <Box className="mb-6">
        <Box className="relative min-h-[44px] items-center justify-center">
          <Text
            className="max-w-[300px] px-8 text-center text-[21px] font-extrabold text-text-primary"
            numberOfLines={1}
          >
            {t('rooms:screen.title')}
          </Text>
          <IconButton
            emoji="👤"
            tone="surface"
            size="lg"
            className="absolute right-0"
            emojiClassName="text-[20px]"
            onPress={openProfile}
            accessibilityRole="button"
            accessibilityLabel={t('common:profile.title')}
          />
        </Box>

        <Text className="mt-4 self-center max-w-[300px] text-center text-[16px] leading-[24px] text-text-tertiary">
          {t('rooms:screen.subtitle')}
        </Text>

        <Box className="mt-8 flex-row items-end gap-2 px-0.5">
          <Text className="text-[20px] font-extrabold text-text-secondary">
            {t('rooms:screen.availableRooms')}
          </Text>
          <Text className="pb-0.5 text-[17px] font-semibold text-text-muted">({rooms.length})</Text>
        </Box>
      </Box>

      <Box className="flex-1">
        <RoomList
          rooms={rooms}
          activeGame={activeGame}
          loading={loading}
          refreshing={refreshing}
          onJoinRoom={joinRoom}
          onReturnToGame={returnToGame}
          onRefresh={refreshRooms}
        />
      </Box>

      {canCreateRoom ? (
        <Box className="pt-sm">
          <Pressable
            className={mergeClassNames(
              'min-h-[58px] flex-row items-center gap-3 rounded-[22px] border px-4',
              badgeToneClassNames.accentSolid,
              surfaceEffectClassNames.accent
            )}
            onPress={() => void handleCreateRoom()}
            disabled={createRoomMutation.isPending}
          >
            <Box className="h-9 w-9 items-center justify-center rounded-full bg-overlay-scrim">
              <Text className="text-[20px] font-bold text-text-primary">+</Text>
            </Box>
            <Box className="min-w-0 flex-1">
              <Text className="text-[14px] font-bold text-text-on-accent">
                {t('rooms:createRoom.title')}
              </Text>
              <Text className="text-[16px] font-extrabold text-text-on-accent">
                {createRoomMutation.isPending
                  ? t('rooms:createRoom.createLoading')
                  : t('common:buttons.create')}
              </Text>
            </Box>
            <Text className="text-[20px] text-text-on-accent">›</Text>
          </Pressable>
        </Box>
      ) : null}
    </ScreenContainer>
  );
};
