type RepositoryPlayer =
  | {
      id: string;
      name: string;
      playerType: 'human' | 'bot';
      score: number;
      isLeaver?: boolean | null;
    }
  | {
      playerId: string;
      name: string;
      playerType: 'human' | 'bot';
      score: number;
      isLeaver?: boolean | null;
    };

export const mapRepositoryPlayer = (player: RepositoryPlayer) => ({
  id: 'playerId' in player ? player.playerId : player.id,
  name: player.name,
  playerType: player.playerType,
  score: player.score,
  isLeaver: player.isLeaver || undefined,
});
