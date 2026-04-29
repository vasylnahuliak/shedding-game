import { GameFiltersButton } from '@/components/GameFiltersButton';
import { appRoutes } from '@/navigation/appRoutes';

import {
  getActiveFiltersCount,
  useProfileStatsFiltersStore,
} from '../../hooks/useProfileStatsFilters';

export const FilterButtons = function FilterButtons() {
  const activeFiltersCount = useProfileStatsFiltersStore((state) =>
    getActiveFiltersCount(state.filters)
  );

  return (
    <GameFiltersButton
      activeFiltersCount={activeFiltersCount}
      href={appRoutes.profileStatsFilters}
    />
  );
};
