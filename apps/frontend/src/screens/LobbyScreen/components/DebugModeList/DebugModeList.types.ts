import type { DebugMode } from '@shedding-game/shared';

export interface DebugModeListProps {
  selected: DebugMode;
  onSelect: (mode: DebugMode) => void;
  disabled?: boolean;
}
