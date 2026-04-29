import { createGameFiltersStore } from '@/hooks/useGameFiltersStore';
import { getActiveGameFiltersCount } from '@/utils/gameFilters';

export const getActiveFiltersCount = getActiveGameFiltersCount;

export const useProfileStatsFiltersStore = createGameFiltersStore();
