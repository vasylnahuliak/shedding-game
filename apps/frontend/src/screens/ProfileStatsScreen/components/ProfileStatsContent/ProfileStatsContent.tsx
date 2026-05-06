import { useMyStatsQuery } from '@/api';
import { Button } from '@/components/Button';
import { GameHistoryStatsList } from '@/components/GameHistoryStatsList';
import { ProfileSectionCard } from '@/components/ProfileSectionCard';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/hooks/useAuthStore';
import { useGameStatistics } from '@/hooks/useGameStatistics';
import { useAppTranslation } from '@/i18n';
import { getGameHistoryListKey } from '@/utils/gameHistory';

import { useProfileStatsFiltersStore } from '../../hooks/useProfileStatsFilters';
import { ProfileStatsLoadGate } from '../ProfileStatsLoadGate';
import { ProfileStatsState } from '../ProfileStatsState';
import { ProfileStatsSummary } from '../ProfileStatsSummary';

export const ProfileStatsContent = function ProfileStatsContent() {
  const { t } = useAppTranslation(['alerts', 'common', 'rooms']);
  const userId = useAuth((state) => state.user?.id);
  const filters = useProfileStatsFiltersStore((state) => state.filters);
  const listKey = getGameHistoryListKey(filters);
  const {
    fetchNextPage,
    games,
    hasNextPage,
    isError,
    isFetching,
    isFetchingNextPage,
    isLoading,
    refreshGames,
    refreshing,
    totalCount,
  } = useGameStatistics('me', filters);
  const {
    data: stats,
    isError: isStatsError,
    isFetching: isStatsFetching,
    isLoading: isStatsLoading,
    refetch: refetchStats,
  } = useMyStatsQuery(filters, { enabled: !!userId });

  const retryAll = () => {
    void Promise.all([refreshGames(), refetchStats()]);
  };

  const refreshAll = async () => {
    await Promise.all([refreshGames(), refetchStats()]);
  };

  const isInitialLoading =
    !userId || ((isLoading || isStatsLoading) && games.length === 0 && !stats);
  const hasBlockingError = (isError || isStatsError) && games.length === 0 && !stats;

  return (
    <ProfileStatsLoadGate
      frame="box"
      isInitialLoading={isInitialLoading}
      hasBlockingError={hasBlockingError}
      loadingDescription={t('common:labels.loading')}
      onRetry={retryAll}
      retrying={isFetching || isStatsFetching}
    >
      <GameHistoryStatsList
        listKey={listKey}
        games={games}
        fetchNextPage={() => void fetchNextPage()}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        refreshing={refreshing || (isStatsFetching && !isStatsLoading)}
        onRefresh={refreshAll}
        emptyTitle={t('rooms:statistics.emptyTitle')}
        emptyDescription={t('rooms:statistics.emptyDescription')}
        headerComponent={
          <Box className="gap-5 pb-5">
            <ProfileSectionCard>
              {stats && !isStatsError ? (
                <ProfileStatsSummary stats={stats} />
              ) : (
                <ProfileStatsState
                  title={t('alerts:errorBoundary.title')}
                  description={t('alerts:errorBoundary.fallback')}
                >
                  <Button
                    title={isStatsFetching ? t('common:labels.loading') : t('common:buttons.retry')}
                    onPress={retryAll}
                    disabled={isStatsFetching}
                  />
                </ProfileStatsState>
              )}
            </ProfileSectionCard>

            {games.length > 0 ? (
              <Text className="px-1 text-[20px] font-extrabold text-text-primary">
                {t('rooms:statistics.gamesTitle', { count: totalCount })}
              </Text>
            ) : null}
          </Box>
        }
      />
    </ProfileStatsLoadGate>
  );
};
