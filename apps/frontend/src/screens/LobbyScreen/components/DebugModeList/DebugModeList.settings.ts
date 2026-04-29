import type { DebugMode } from '@shedding-game/shared';

type DebugModeOption = {
  key: DebugMode;
  label?: string;
  labelKey?: 'rooms:debugModes.none';
};

export const DEBUG_MODES: DebugModeOption[] = [
  { key: 'none', labelKey: 'rooms:debugModes.none' },
  { key: 'one_jack_four_sixes', label: '6' },
  { key: 'one_jack_four_sevens', label: '7' },
  { key: 'one_jack_four_eights', label: '8' },
  { key: 'one_six_four_jacks', label: 'J' },
  { key: 'one_jack_four_kings', label: 'K' },
  { key: 'one_jack_four_aces', label: 'A' },
];
