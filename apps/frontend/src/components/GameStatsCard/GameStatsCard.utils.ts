import type { GameStatus } from '@shedding-game/shared';

type GameStatsStatusLabelKey =
  | 'admin:status.closed'
  | 'admin:status.waiting'
  | 'admin:status.playing'
  | 'admin:status.roundOver'
  | 'admin:status.finished';

export const getGameStatsStatusLabelKey = (
  gameStatus: GameStatus,
  isClosed?: boolean
): GameStatsStatusLabelKey => {
  if (isClosed) return 'admin:status.closed';

  switch (gameStatus) {
    case 'waiting':
      return 'admin:status.waiting';
    case 'playing':
      return 'admin:status.playing';
    case 'round_over':
      return 'admin:status.roundOver';
    case 'finished':
      return 'admin:status.finished';
  }
};
