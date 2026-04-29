import { create } from 'zustand';

import { createDefaultGameFilters, type GameFilters } from '@/utils/gameFilters';

type GameFiltersStoreState = {
  filters: GameFilters;
  resetFilters: () => void;
  setFilter: <K extends keyof GameFilters>(filterKey: K, value: GameFilters[K]) => void;
};

export const createGameFiltersStore = () =>
  create<GameFiltersStoreState>((set) => ({
    filters: createDefaultGameFilters(),
    setFilter: (filterKey, value) => {
      set((prev) => ({
        filters: {
          ...prev.filters,
          [filterKey]: value,
        },
      }));
    },
    resetFilters: () =>
      set({
        filters: createDefaultGameFilters(),
      }),
  }));
