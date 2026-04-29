import type { GamePace } from '@shedding-game/shared';

import { DEFAULT_GAME_PACE, GAME_PACES, getGamePaceConfig } from '@shedding-game/shared';

import { formatDuration } from '@/i18n';

export const GAME_PACE_EMOJIS: Record<GamePace, string> = {
  debug: '🐞',
  quick: '⚡',
  long: '🕰️',
};

type GamePaceTitleKey = `rooms:gamePaces.${GamePace}.title`;
type GamePaceDescriptionKey = 'rooms:gamePaceDetails.maxTurn';
type GamePaceDescriptionOptions = ReturnType<typeof getGamePaceTimingLabels>;
type GamePaceTranslate = (
  key: GamePaceDescriptionKey,
  options: GamePaceDescriptionOptions
) => unknown;

const GAME_PACE_COPY = {
  debug: {
    titleKey: 'rooms:gamePaces.debug.title',
  },
  quick: {
    titleKey: 'rooms:gamePaces.quick.title',
  },
  long: {
    titleKey: 'rooms:gamePaces.long.title',
  },
} as const satisfies Record<GamePace, { titleKey: GamePaceTitleKey }>;

const GAME_PACE_OPTIONS = GAME_PACES.map((key) => ({
  key,
  ...GAME_PACE_COPY[key],
}));

export const getGamePaceOptions = (includeDebug: boolean) =>
  GAME_PACE_OPTIONS.filter(({ key }) => includeDebug || key !== 'debug');

export const getGamePaceCopy = (gamePace?: GamePace | null) =>
  GAME_PACE_COPY[gamePace ?? DEFAULT_GAME_PACE];

const getGamePaceTimingLabels = (locale: string, gamePace: GamePace) => {
  const { kickDelayMs } = getGamePaceConfig(gamePace);

  return {
    maxTurn: formatDuration(locale, kickDelayMs / 1_000),
  };
};

export const getGamePaceDescription = (
  locale: string,
  gamePace: GamePace,
  translate: GamePaceTranslate
) => {
  const timingLabels = getGamePaceTimingLabels(locale, gamePace);

  return String(translate('rooms:gamePaceDetails.maxTurn', timingLabels));
};
