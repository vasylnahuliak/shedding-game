import { GameFiltersModal } from '@/components/GameFiltersModal';

import { useProfileStatsFiltersStore } from '../../hooks/useProfileStatsFilters';

type FilterModalProps = {
  onClose: () => void;
};

export const FilterModal = function FilterModal({ onClose }: FilterModalProps) {
  const filters = useProfileStatsFiltersStore((state) => state.filters);
  const setFilter = useProfileStatsFiltersStore((state) => state.setFilter);

  return <GameFiltersModal filters={filters} onClose={onClose} setFilter={setFilter} />;
};
