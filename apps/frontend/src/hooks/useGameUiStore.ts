import { create } from 'zustand';

export type SuitPickerMode = 'play' | 'opening_pass';

type GameUiState = {
  suitPickerMode: SuitPickerMode | null;
  pendingBridgeJack: boolean;
  drawButtonDisabled: boolean;
};

type GameUiStore = GameUiState & {
  setSuitPickerMode: (mode: SuitPickerMode | null) => void;
  setPendingBridgeJack: (isPending: boolean) => void;
  setDrawButtonDisabled: (isDisabled: boolean) => void;
  reset: () => void;
};

const initialState: GameUiState = {
  suitPickerMode: null,
  pendingBridgeJack: false,
  drawButtonDisabled: false,
};

export const useGameUiStore = create<GameUiStore>((set) => ({
  ...initialState,
  setSuitPickerMode: (mode) => set({ suitPickerMode: mode }),
  setPendingBridgeJack: (isPending) => set({ pendingBridgeJack: isPending }),
  setDrawButtonDisabled: (isDisabled) => set({ drawButtonDisabled: isDisabled }),
  reset: () => set(initialState),
}));
