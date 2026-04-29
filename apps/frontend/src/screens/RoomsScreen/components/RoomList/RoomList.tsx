/* jscpd:ignore-start */
import { Pressable } from 'react-native';

import { ListEmptyState } from '@/components/ListEmptyState';
import { ListLoadingState } from '@/components/ListLoadingState';
import { Box } from '@/components/ui/box';
import { StyledLegendList } from '@/components/ui/interop';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { useAppTranslation } from '@/i18n';
import {
  badgeBaseClassNames,
  badgeTextToneClassNames,
  badgeToneClassNames,
  panelClassNames,
  surfaceEffectClassNames,
} from '@/theme';
import type { ActiveGame, Room } from '@/types/rooms';
/* jscpd:ignore-end */

type RoomSurfaceTone = 'default' | 'featured' | 'current' | 'disabled';
type RoomActionTone = 'default' | 'primary' | 'current' | 'disabled';

const ROOM_SURFACE_CLASS_NAMES: Record<RoomSurfaceTone, string> = {
  default:
    mergeClassNames(panelClassNames.subtleCard, 'px-4 py-3.5', surfaceEffectClassNames.raised) ??
    '',
  featured:
    mergeClassNames(
      panelClassNames.accentStrong,
      'rounded-[22px] px-4 py-3.5',
      surfaceEffectClassNames.raised
    ) ?? '',
  current:
    mergeClassNames(panelClassNames.action, 'px-4 py-3.5', surfaceEffectClassNames.raised) ?? '',
  disabled:
    mergeClassNames(panelClassNames.closed, 'px-4 py-3.5', surfaceEffectClassNames.raised) ?? '',
};

const ROOM_BADGE_CLASS_NAMES: Record<RoomSurfaceTone, string> = {
  default:
    mergeClassNames('self-start', badgeBaseClassNames.chip, badgeToneClassNames.neutral) ?? '',
  featured:
    mergeClassNames('self-start', badgeBaseClassNames.chip, badgeToneClassNames.accentSolid) ?? '',
  current:
    mergeClassNames('self-start', badgeBaseClassNames.chip, badgeToneClassNames.action) ?? '',
  disabled:
    mergeClassNames('self-start', badgeBaseClassNames.chip, badgeToneClassNames.danger) ?? '',
};

const ROOM_BADGE_TEXT_CLASS_NAMES: Record<RoomSurfaceTone, string> = {
  default: mergeClassNames('text-[13px] font-bold', badgeTextToneClassNames.neutral) ?? '',
  featured: mergeClassNames('text-[13px] font-bold', badgeTextToneClassNames.onAccent) ?? '',
  current: mergeClassNames('text-[13px] font-bold', badgeTextToneClassNames.action) ?? '',
  disabled: mergeClassNames('text-[13px] font-bold', badgeTextToneClassNames.danger) ?? '',
};

const ROOM_META_TEXT_CLASS_NAMES: Record<RoomSurfaceTone, string> = {
  default: 'mt-1.5 text-[14px] leading-5 text-text-tertiary',
  featured: 'mt-1.5 text-[14px] leading-5 text-text-tertiary',
  current: 'mt-1.5 text-[14px] leading-5 text-text-tertiary',
  disabled: 'mt-1.5 text-[14px] leading-5 text-feedback-danger',
};

const ROOM_ACTION_CLASS_NAMES: Record<RoomActionTone, string> = {
  default:
    mergeClassNames(
      'min-h-[40px] min-w-[92px] items-center justify-center rounded-[16px] border px-3.5',
      badgeToneClassNames.neutral,
      surfaceEffectClassNames.card
    ) ?? '',
  primary:
    mergeClassNames(
      'min-h-[40px] min-w-[92px] items-center justify-center rounded-[16px] border px-3.5',
      badgeToneClassNames.accentSolid,
      surfaceEffectClassNames.accent
    ) ?? '',
  current:
    mergeClassNames(
      'min-h-[40px] min-w-[92px] items-center justify-center rounded-[16px] border px-3.5',
      badgeToneClassNames.action,
      surfaceEffectClassNames.card
    ) ?? '',
  disabled:
    mergeClassNames(
      'min-h-[40px] min-w-[92px] items-center justify-center rounded-[16px] border px-3.5',
      badgeToneClassNames.mutedSurface
    ) ?? '',
};

const ROOM_ACTION_TEXT_CLASS_NAMES: Record<RoomActionTone, string> = {
  default: mergeClassNames('text-[14px] font-extrabold', badgeTextToneClassNames.neutral) ?? '',
  primary: mergeClassNames('text-[14px] font-extrabold', badgeTextToneClassNames.onAccent) ?? '',
  current: mergeClassNames('text-[14px] font-extrabold', badgeTextToneClassNames.action) ?? '',
  disabled: mergeClassNames('text-[14px] font-extrabold', badgeTextToneClassNames.muted) ?? '',
};

type RoomListProps = {
  rooms: Room[];
  activeGame: ActiveGame | null;
  loading: boolean;
  refreshing: boolean;
  onJoinRoom: (roomId: string) => Promise<void>;
  onReturnToGame: (roomId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
};

export const RoomList = ({
  rooms,
  activeGame,
  loading,
  refreshing,
  onJoinRoom,
  onReturnToGame,
  onRefresh,
}: RoomListProps) => {
  const { t } = useAppTranslation(['rooms', 'common']);

  const renderActionButton = ({
    label,
    onPress,
    disabled = false,
    isPrimary = false,
    isCurrent = false,
  }: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
    isPrimary?: boolean;
    isCurrent?: boolean;
  }) => {
    const actionTone: RoomActionTone = disabled
      ? 'disabled'
      : isCurrent
        ? 'current'
        : isPrimary
          ? 'primary'
          : 'default';

    return (
      <Pressable
        className={ROOM_ACTION_CLASS_NAMES[actionTone]}
        onPress={onPress}
        disabled={disabled}
      >
        <Text className={ROOM_ACTION_TEXT_CLASS_NAMES[actionTone]}>{label}</Text>
      </Pressable>
    );
  };

  const renderRoomSurface = ({
    badge,
    title,
    meta,
    action,
    disabled = false,
    isCurrent = false,
    isFeatured = false,
  }: {
    badge: string;
    title: string;
    meta: string;
    action: React.ReactNode;
    disabled?: boolean;
    isCurrent?: boolean;
    isFeatured?: boolean;
  }) => {
    const surfaceTone: RoomSurfaceTone = isFeatured
      ? 'featured'
      : isCurrent
        ? 'current'
        : disabled
          ? 'disabled'
          : 'default';

    return (
      <Box className={mergeClassNames('mb-md', ROOM_SURFACE_CLASS_NAMES[surfaceTone])}>
        <Box className="flex-row items-center gap-3">
          <Box className="min-w-0 flex-1">
            <Box className="flex-row items-start justify-between gap-2">
              <Text
                className="min-w-0 flex-1 text-[18px] font-extrabold text-text-primary"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {title}
              </Text>
              <Box className={ROOM_BADGE_CLASS_NAMES[surfaceTone]}>
                <Text className={ROOM_BADGE_TEXT_CLASS_NAMES[surfaceTone]}>{badge}</Text>
              </Box>
            </Box>
            <Text className={ROOM_META_TEXT_CLASS_NAMES[surfaceTone]} numberOfLines={2}>
              {meta}
            </Text>
          </Box>

          <Box className="shrink-0">{action}</Box>
        </Box>
      </Box>
    );
  };

  if (loading && rooms.length === 0 && !activeGame) {
    return <ListLoadingState text={t('rooms:roomList.loading')} />;
  }

  const renderActiveGame = () => {
    if (!activeGame) return null;

    return renderRoomSurface({
      badge: t('rooms:roomList.activeGameBadge'),
      title: activeGame.name,
      meta: t('rooms:roomList.activeGameMeta', {
        players: t('rooms:units.players', { count: activeGame.playersCount }),
      }),
      isFeatured: true,
      action: renderActionButton({
        label: t('common:buttons.return'),
        onPress: () => {
          void onReturnToGame(activeGame.id);
        },
        isCurrent: true,
      }),
    });
  };

  return (
    <StyledLegendList
      className="flex-1"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName={mergeClassNames(
        rooms.length === 0 && !activeGame && 'flex-1',
        'pb-2'
      )}
      data={rooms}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={renderActiveGame}
      showsVerticalScrollIndicator={false}
      refreshing={refreshing}
      onRefresh={() => {
        void onRefresh();
      }}
      renderItem={({ item }) => {
        const isFull = item.playersCount >= item.maxPlayers;
        const isInRoom = item.isCurrentUserInRoom;
        const disabled = isFull && !isInRoom;
        const maxPlayersLabel = String(item.maxPlayers);
        const metaText = isFull
          ? t('rooms:roomList.fullMeta', { count: item.playersCount, max: maxPlayersLabel })
          : t('rooms:roomList.waitingMeta', { count: item.playersCount, max: maxPlayersLabel });

        const buttonText = isInRoom
          ? t('common:buttons.return')
          : isFull
            ? t('common:buttons.full')
            : t('common:buttons.join');

        return renderRoomSurface({
          badge: `${item.playersCount}/${item.maxPlayers}`,
          title: item.name,
          meta: metaText,
          disabled,
          isCurrent: isInRoom,
          action: renderActionButton({
            label: buttonText,
            onPress: () => {
              void onJoinRoom(item.id);
            },
            disabled,
            isPrimary: !disabled && !isInRoom,
            isCurrent: isInRoom,
          }),
        });
      }}
      ListEmptyComponent={
        !loading && !activeGame ? (
          <ListEmptyState
            title={t('rooms:roomList.emptyTitle')}
            description={t('rooms:roomList.emptyDescription')}
            icon="🎲"
          />
        ) : null
      }
    />
  );
};
