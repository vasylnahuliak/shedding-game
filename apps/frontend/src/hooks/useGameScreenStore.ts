import type { Card as CardType } from '@shedding-game/shared';
import { create } from 'zustand';

import type { RoomDetails } from '@/types/rooms';

type GameScreenState = {
  room: RoomDetails | null;
  selectedCards: CardType[];
};

type GameScreenStore = GameScreenState & {
  setRoom: (room: RoomDetails) => void;
  clearRoom: () => void;
  setSelectedCards: (cards: CardType[]) => void;
  clearSelectedCards: () => void;
  reset: () => void;
};

const initialState: GameScreenState = {
  room: null,
  selectedCards: [],
};

export const useGameScreenStore = create<GameScreenStore>((set) => ({
  ...initialState,
  setRoom: (room) => set({ room }),
  clearRoom: () => set({ room: null }),
  setSelectedCards: (cards) => set({ selectedCards: cards }),
  clearSelectedCards: () => set({ selectedCards: [] }),
  reset: () => set(initialState),
}));
