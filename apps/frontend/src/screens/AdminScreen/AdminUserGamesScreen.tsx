import { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';

import { GameHistoryStatsList } from '@/components/GameHistoryStatsList';
import { ProfileSectionCard } from '@/components/ProfileSectionCard';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { useAppTranslation } from '@/i18n';
import { ProfileStatsLoadGate } from '@/screens/ProfileStatsScreen/components/ProfileStatsLoadGate';
import { ProfileStatsState } from '@/screens/ProfileStatsScreen/components/ProfileStatsState';
import { ProfileStatsSummary } from '@/screens/ProfileStatsScreen/components/ProfileStatsSummary';
import { getGameHistoryListKey } from '@/utils/gameHistory';

import { useAdminFiltersStore } from './hooks/useAdminFilters';
import { useAdminUserGameHistory } from './hooks/useAdminUserGameHistory';

type AdminUserGamesScreenProps = {
  userId: string;
};

export const AdminUserGamesScreen = ({ userId }: AdminUserGamesScreenProps) => {
  const { t } = useAppTranslation(['admin', 'common']);
  const filters = useAdminFiltersStore((state) => state.filters);
  const resetAdminFilters = useAdminFiltersStore((state) => state.resetFilters);
  const listKey = `${userId}:${getGameHistoryListKey(filters)}`;
  const {
    fetchNextPage,
    games,
    hasNextPage,
    isError,
    isFetching,
    isFetchingNextPage,
    isLoading,
    isStatsError,
    isStatsFetching,
    isStatsLoading,
    refreshAll,
    refreshing,
    stats,
    totalCount,
  } = useAdminUserGameHistory(userId, filters);

  useEffect(
    function resetAdminUserGameFiltersOnUnmount() {
      return () => {
        resetAdminFilters();
      };
    },
    [resetAdminFilters]
  );

  const retryAll = () => {
    void refreshAll();
  };
  const isInitialLoading = (isLoading || isStatsLoading) && games.length === 0 && !stats;
  const hasBlockingError = (isError || isStatsError) && games.length === 0 && !stats;

  return (
    <ProfileStatsLoadGate
      frame="screen"
      isInitialLoading={isInitialLoading}
      hasBlockingError={hasBlockingError}
      loadingDescription={t('admin:userGamesScreen.loading')}
      onRetry={retryAll}
      retrying={isFetching || isStatsFetching}
    >
      <ScreenContainer edges={['bottom']}>
        <GameHistoryStatsList
          listKey={listKey}
          games={games}
          fetchNextPage={() => void fetchNextPage()}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onRefresh={refreshAll}
          refreshing={refreshing}
          emptyTitle={t('admin:userGamesScreen.emptyTitle')}
          emptyDescription={t('admin:userGamesScreen.emptyDescription')}
          headerComponent={
            <Box className="gap-5 pb-5">
              <ProfileSectionCard title={t('admin:userGamesScreen.statsTitle')}>
                {stats && !isStatsError ? (
                  <ProfileStatsSummary stats={stats} />
                ) : (
                  <ProfileStatsState
                    leading={<ActivityIndicator size="large" colorClassName="accent-text-accent" />}
                    description={t('common:labels.loading')}
                  />
                )}
              </ProfileSectionCard>

              {games.length > 0 ? (
                <Text className="px-1 text-[20px] font-extrabold text-text-primary">
                  {t('admin:userGamesScreen.gamesTitle', { count: totalCount })}
                </Text>
              ) : null}
            </Box>
          }
        />
      </ScreenContainer>
    </ProfileStatsLoadGate>
  );
};
