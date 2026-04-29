import { SCORE_ELIMINATION_THRESHOLD } from './constants';
import type { AdminGame, UserStats } from './contracts';

const shouldCountGameInStats = (game: AdminGame) => {
  return !(game.gameStatus === 'waiting' && !game.gameStartedAt);
};

export const calculateUserStatsFromGames = (games: AdminGame[], userId: string): UserStats => {
  let wins = 0;
  let losses = 0;
  let gamesPlayed = 0;

  for (const game of games) {
    const player = game.players.find((entry) => entry.id === userId);

    if (!player || !shouldCountGameInStats(game)) {
      continue;
    }

    gamesPlayed++;

    if (game.gameStatus !== 'finished') {
      continue;
    }

    if ((player.score ?? SCORE_ELIMINATION_THRESHOLD) < SCORE_ELIMINATION_THRESHOLD) {
      wins++;
      continue;
    }

    losses++;
  }

  return { wins, losses, gamesPlayed };
};
