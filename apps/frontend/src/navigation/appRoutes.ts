import type { Href, Route } from 'expo-router';

type RoomRouteParams = {
  roomId: string;
};

type RoomBotRouteParams = RoomRouteParams & {
  botId: string;
};

type GameModalRouteName =
  | 'info'
  | 'rules'
  | 'score'
  | 'suit-picker'
  | 'bridge'
  | 'round-over'
  | 'game-over';

export type ForcedGameModalRouteName = 'suit-picker' | 'bridge' | 'round-over' | 'game-over';

const GAME_MODAL_ROUTE_NAMES = [
  'info',
  'rules',
  'score',
  'suit-picker',
  'bridge',
  'round-over',
  'game-over',
] as const satisfies readonly GameModalRouteName[];

const GAME_FORCED_MODAL_ROUTE_NAMES = [
  'suit-picker',
  'bridge',
  'round-over',
  'game-over',
] as const satisfies readonly ForcedGameModalRouteName[];

const buildRoomHref = <P extends Route>(pathname: P, roomId: string) => ({
  pathname,
  params: { roomId },
});

const buildRoomBotHref = <P extends Route>(pathname: P, roomId: string, botId: string) => ({
  pathname,
  params: { roomId, botId },
});

export const appRoutes = {
  home: '/' satisfies Href,
  profile: '/profile' satisfies Href,
  profileStats: '/profile-stats' satisfies Href,
  profileStatsFilters: '/profile-stats/filters' as Href,
  profileSettings: '/profile-settings' satisfies Href,
  profileSettingsEdit: '/profile-settings/edit-profile' satisfies Href,
  profileSettingsPassword: '/profile-settings/change-password' satisfies Href,
  profileSettingsSuitDisplayMode: '/profile-settings/suit-display-mode' satisfies Href,
  profileSettingsDebug: '/profile-settings/debug' satisfies Href,
  admin: '/admin' satisfies Href,
  adminGames: '/admin/games' satisfies Href,
  adminAccountDeletionRequests: '/admin/account-deletion-requests' satisfies Href,
  adminFilters: '/admin/filters' satisfies Href,
  emojiPicker: '/emoji-picker' satisfies Href,
  lobby: ({ roomId }: RoomRouteParams) => buildRoomHref('/lobby', roomId),
  lobbyInfo: ({ roomId }: RoomRouteParams) => buildRoomHref('/lobby/info', roomId),
  lobbyGamePace: ({ roomId }: RoomRouteParams) => buildRoomHref('/lobby/game-pace', roomId),
  lobbyDebugMode: ({ roomId }: RoomRouteParams) => buildRoomHref('/lobby/debug-mode', roomId),
  lobbyRenameRoom: ({ roomId }: RoomRouteParams) => buildRoomHref('/lobby/rename-room', roomId),
  lobbyRenameBot: ({ roomId, botId }: RoomBotRouteParams) =>
    buildRoomBotHref('/lobby/rename-bot', roomId, botId),
  game: ({ roomId }: RoomRouteParams) => buildRoomHref('/game', roomId),
  gameInfo: ({ roomId }: RoomRouteParams) => buildRoomHref('/game/info', roomId),
  gameRules: ({ roomId }: RoomRouteParams) => buildRoomHref('/game/rules', roomId),
  gameScore: ({ roomId }: RoomRouteParams) => buildRoomHref('/game/score', roomId),
  gameSuitPicker: ({ roomId }: RoomRouteParams) => buildRoomHref('/game/suit-picker', roomId),
  gameBridge: ({ roomId }: RoomRouteParams) => buildRoomHref('/game/bridge', roomId),
  gameRoundOver: ({ roomId }: RoomRouteParams) => buildRoomHref('/game/round-over', roomId),
  gameOver: ({ roomId }: RoomRouteParams) => buildRoomHref('/game/game-over', roomId),
} as const;

export const getGameModalRouteName = (pathname: string): GameModalRouteName | null => {
  const normalizedPathname = pathname.split('?')[0];

  if (!normalizedPathname.startsWith('/game/')) {
    return null;
  }

  const modalRouteName = normalizedPathname.slice('/game/'.length);

  return GAME_MODAL_ROUTE_NAMES.includes(modalRouteName as GameModalRouteName)
    ? (modalRouteName as GameModalRouteName)
    : null;
};

export const isForcedGameModalRouteName = (
  routeName: GameModalRouteName | null
): routeName is ForcedGameModalRouteName =>
  GAME_FORCED_MODAL_ROUTE_NAMES.includes(routeName as ForcedGameModalRouteName);

export const normalizeTrackedPathname = (pathname: string) => {
  const normalizedPathname = pathname.split('?')[0];

  if (normalizedPathname.startsWith('/game/')) {
    return '/game';
  }

  if (normalizedPathname.startsWith('/admin/')) {
    return '/admin';
  }

  if (normalizedPathname.startsWith('/lobby/')) {
    return '/lobby';
  }

  if (normalizedPathname.startsWith('/profile-settings/')) {
    return '/profile-settings';
  }

  if (normalizedPathname.startsWith('/profile-stats/')) {
    return '/profile-stats';
  }

  return normalizedPathname;
};
