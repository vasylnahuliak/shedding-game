import type { GamePace } from '@shedding-game/shared';

export interface GamePaceListProps {
  selected: GamePace;
  onSelect: (pace: GamePace) => void;
  disabled?: boolean;
}
