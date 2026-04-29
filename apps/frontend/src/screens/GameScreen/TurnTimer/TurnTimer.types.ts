import type { GamePace } from '@shedding-game/shared';

export interface TurnTimerProps {
  isActive: boolean;
  isMyTurn: boolean;
  currentPlayerName?: string;
  gamePace: GamePace;
  turnStartedAt: number | null;
}
