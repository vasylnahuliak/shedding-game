import { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, Pressable } from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { MAX_PLAYERS } from '@shedding-game/shared';

import { Emoji } from '@/components/Emoji';
import { EmojiReactionButtons } from '@/components/EmojiReactionButtons';
import { IconButton } from '@/components/IconButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { useCanAccessAdmin } from '@/hooks';
import { useAppTranslation } from '@/i18n';
import { appRoutes } from '@/navigation/appRoutes';
import { SocketService } from '@/services/SocketService';
import { panelClassNames, surfaceEffectClassNames } from '@/theme';

import { LoadingScreen } from '../LoadingScreen';

import { ActionButton, Badge, GamePaceCard, InviteButton } from './components';
import { DebugModeCard } from './components/DebugModeCard';
import { PlayersSlots } from './components/PlayersSlots';
import { useLobby } from './useLobby';

export const LobbyScreen = () => {
  const { t } = useAppTranslation('lobby');
  const router = useRouter();
  const {
    roomId,
    room,
    hostId,
    loading,
    isHostUser,
    playerCount,
    canStartGame,
    roomIsFull,
    isAddingBot,
    startGame,
    addBot,
    kickPlayer,
    leaveRoom,
    reorderPlayers,
    refreshRoom,
  } = useLobby();

  const handleLongPressRoomName = () => {
    if (!roomId) return;
    router.push(appRoutes.lobbyRenameRoom({ roomId }));
  };

  const handleLongPressBot = (botId: string) => {
    if (!roomId) return;
    router.push(appRoutes.lobbyRenameBot({ roomId, botId }));
  };

  const canAccessAdmin = useCanAccessAdmin();

  const lastSyncRef = useRef(0);

  const syncRoom = useCallback(async () => {
    if (!roomId) return;
    const now = Date.now();
    if (now - lastSyncRef.current < 5000) return;
    lastSyncRef.current = now;
    await refreshRoom();
  }, [roomId, refreshRoom]);

  useEffect(
    function subscribeToLobbyRoomRefresh() {
      const handleSocketConnect = () => {
        void syncRoom();
      };

      SocketService.on('connect', handleSocketConnect);

      return () => {
        SocketService.off('connect', handleSocketConnect);
      };
    },
    [syncRoom]
  );

  useFocusEffect(
    useCallback(
      function syncLobbyRoomOnFocus() {
        void syncRoom();
      },
      [syncRoom]
    )
  );

  if (!roomId) {
    return (
      <ScreenContainer contentClassName="flex-1 items-center justify-center">
        <Text className="text-[18px] text-feedback-danger">{t('screen.roomNotFound')}</Text>
      </ScreenContainer>
    );
  }

  if (loading && !room) {
    return <LoadingScreen />;
  }

  return (
    <ScreenContainer
      edges={['top', 'bottom']}
      contentClassName="bg-surface-screen px-3.5 pt-3 pb-3.5"
    >
      <Box className="flex-1">
        <Box
          className={mergeClassNames(
            panelClassNames.card,
            'mb-5 px-3.5 py-3.5',
            surfaceEffectClassNames.raised
          )}
        >
          <Box className="flex-row items-center gap-2.5">
            <InviteButton roomId={roomId} />

            <Pressable
              className="min-w-0 flex-1 pt-0.5"
              onLongPress={handleLongPressRoomName}
              disabled={!isHostUser}
            >
              <Text
                className="w-full text-[24px] font-extrabold text-text-primary"
                adjustsFontSizeToFit
                minimumFontScale={0.4}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {room?.name ?? t('screen.roomLoading')}
              </Text>
            </Pressable>

            <Box className="flex-row items-center gap-1.5 self-start">
              {canAccessAdmin && room ? (
                <DebugModeCard debugMode={room.debugMode ?? 'none'} roomId={roomId} />
              ) : null}
              {room ? <GamePaceCard gamePace={room.gamePace} roomId={roomId} /> : null}
              <IconButton
                emoji="✕"
                tone="danger"
                emojiClassName="text-[16px] font-bold text-feedback-danger"
                onPress={leaveRoom}
              />
            </Box>
          </Box>
        </Box>

        <Box className={mergeClassNames(panelClassNames.card, 'mb-5 rounded-[22px] px-4 py-3')}>
          <Box className="flex-row items-center justify-between gap-3">
            <Box className="min-w-0 flex-1 flex-row items-center gap-2.5">
              <Text className="text-[20px] font-extrabold text-text-primary">
                {t('screen.playersSection')}
              </Text>
              <Pressable
                className="h-8 w-8 items-center justify-center rounded-[12px]"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => router.push(appRoutes.lobbyInfo({ roomId }))}
              >
                <Emoji emoji="ℹ️" className="text-[16px]" size={16} />
              </Pressable>
            </Box>
            <Box className="flex-row items-center gap-2">
              <EmojiReactionButtons roomId={roomId} direction="horizontal" buttonSize={30} />
              <Badge
                text={`${playerCount}/${MAX_PLAYERS}`}
                variant={canStartGame ? 'host' : 'primary'}
              />
            </Box>
          </Box>
        </Box>

        <Box className="flex-1 min-h-0 pt-1">
          <PlayersSlots
            players={room?.players ?? []}
            hostId={hostId}
            isHostUser={isHostUser}
            canAddBot={!roomIsFull}
            isAddingBot={isAddingBot}
            onAddBot={addBot}
            onRenameBot={handleLongPressBot}
            onKick={kickPlayer}
            onReorder={reorderPlayers}
          />
        </Box>
      </Box>

      <Box className="pt-5">
        {isHostUser ? (
          <ActionButton
            title={t('actions.startGame')}
            icon="🎮"
            variant="primary"
            onPress={startGame}
            disabled={!canStartGame}
          />
        ) : (
          <Box
            className={mergeClassNames(
              panelClassNames.card,
              'min-h-[60px] flex-row items-center justify-center gap-3 rounded-[20px] px-4',
              surfaceEffectClassNames.raised
            )}
          >
            <ActivityIndicator size="small" colorClassName="accent-text-accent" />
            <Text className="text-[16px] font-semibold text-text-secondary">
              {t('screen.waitingHost')}
            </Text>
          </Box>
        )}
      </Box>
    </ScreenContainer>
  );
};
