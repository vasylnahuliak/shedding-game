import { GameFiltersButton } from '@/components/GameFiltersButton';
import { appRoutes } from '@/navigation/appRoutes';

import { getActiveFiltersCount, useAdminFiltersStore } from '../../hooks/useAdminFilters';

export const FilterButtons = function FilterButtons() {
  const activeFiltersCount = useAdminFiltersStore((state) => getActiveFiltersCount(state.filters));

  return (
    <GameFiltersButton activeFiltersCount={activeFiltersCount} href={appRoutes.adminFilters} />
  );
};
