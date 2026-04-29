import { useEffect } from 'react';

import { ListPaginationFooter } from '@/components/ListPaginationFooter';
import { useAppTranslation } from '@/i18n';
import { getGameHistoryItemKey, getGameHistoryListKey } from '@/utils/gameHistory';

import { AdminDataListScreen } from './components/AdminDataListScreen';
import { AdminGameCard } from './components/AdminGameCard';
import { useAdminFiltersStore } from './hooks/useAdminFilters';
import { useAdminGames } from './hooks/useAdminGames';

export const AdminGamesScreen = () => {
  const { t } = useAppTranslation('admin');
  const {
    fetchNextPage,
    games,
    hasNextPage,
    isFetchingNextPage,
    loading,
    refreshing,
    refreshGames,
    totalCount,
  } = useAdminGames();
  const filters = useAdminFiltersStore((state) => state.filters);
  const listKey = getGameHistoryListKey(filters);
  const resetAdminFilters = useAdminFiltersStore((state) => state.resetFilters);

  useEffect(
    function resetAdminFiltersOnUnmount() {
      return () => {
        resetAdminFilters();
      };
    },
    [resetAdminFilters]
  );

  return (
    <AdminDataListScreen
      data={games}
      emptyDescription={t('gamesScreen.emptyDescription')}
      emptyTitle={t('gamesScreen.emptyTitle')}
      keyExtractor={getGameHistoryItemKey}
      loading={loading}
      loadingText={t('gamesScreen.loading')}
      listFooterComponent={<ListPaginationFooter isLoadingMore={isFetchingNextPage} />}
      listKey={listKey}
      onEndReached={() => {
        if (!hasNextPage || isFetchingNextPage) {
          return;
        }

        void fetchNextPage();
      }}
      onRefresh={refreshGames}
      refreshing={refreshing}
      renderItem={({ item }) => <AdminGameCard game={item} />}
      title={t('gamesScreen.allGames', { count: totalCount })}
    />
  );
};
