import type { Player, RoundScore } from '@/types/rooms';

export type ScoreTableProps = {
  players: Player[];
  scoreHistory?: RoundScore[][];
  /** Max visible rows in scroll area (default 4). Use 2 for round/game end, 7 for score modal. */
  maxVisibleRows?: number;
  /** Player IDs ready for next round. Shows status emojis when provided. */
  readyForNextRoundPlayerIds?: string[];
};
