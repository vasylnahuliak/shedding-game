import { useEffect } from 'react';

import { ScreenContainer } from '@/components/ScreenContainer';

import { ProfileStatsContent } from './components/ProfileStatsContent';
import { useProfileStatsFiltersStore } from './hooks/useProfileStatsFilters';

export const ProfileStatsScreen = () => {
  const resetFilters = useProfileStatsFiltersStore((state) => state.resetFilters);

  useEffect(
    function resetProfileStatsFiltersOnUnmount() {
      return () => {
        resetFilters();
      };
    },
    [resetFilters]
  );

  return (
    <ScreenContainer edges={['bottom']}>
      <ProfileStatsContent />
    </ScreenContainer>
  );
};
