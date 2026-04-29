import { GameFiltersModal } from '@/components/GameFiltersModal';

import { useAdminFiltersStore } from '../../hooks/useAdminFilters';

type FilterModalProps = {
  onClose: () => void;
};

export const FilterModal = function FilterModal({ onClose }: FilterModalProps) {
  const filters = useAdminFiltersStore((state) => state.filters);
  const setFilter = useAdminFiltersStore((state) => state.setFilter);

  return <GameFiltersModal filters={filters} onClose={onClose} setFilter={setFilter} />;
};
