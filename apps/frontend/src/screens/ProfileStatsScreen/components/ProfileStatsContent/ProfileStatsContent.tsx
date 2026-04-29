import { ActivityIndicator } from 'react-native';

import { useMyStatsQuery } from '@/api';
import { Button } from '@/components/Button';
import { GameStatsCard } from '@/components/GameStatsCard';
import { ListEmptyState } from '@/components/ListEmptyState';
import { ListPaginationFooter } from '@/components/ListPaginationFooter';
import { ProfileSectionCard } from '@/components/ProfileSectionCard';
import { Box } from '@/components/ui/box';
import { StyledLegendList } from '@/components/ui/interop';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/hooks/useAuthStore';
import { useGameStatistics } from '@/hooks/useGameStatistics';
import { useAppTranslation } from '@/i18n';
import { getGameHistoryItemKey, getGameHistoryListKey } from '@/utils/gameHistory';

import { useProfileStatsFiltersStore } from '../../hooks/useProfileStatsFilters';
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

  if (isInitialLoading) {
    return (
      <Box className="flex-1">
        <ProfileSectionCard>
          <ProfileStatsState
            leading={<ActivityIndicator size="large" colorClassName="accent-text-accent" />}
            description={t('common:labels.loading')}
          />
        </ProfileSectionCard>
      </Box>
    );
  }

  if (hasBlockingError) {
    return (
      <Box className="flex-1">
        <ProfileSectionCard>
          <ProfileStatsState
            title={t('alerts:errorBoundary.title')}
            description={t('alerts:errorBoundary.fallback')}
          >
            <Button
              title={
                isFetching || isStatsFetching
                  ? t('common:labels.loading')
                  : t('common:buttons.retry')
              }
              onPress={retryAll}
              disabled={isFetching || isStatsFetching}
            />
          </ProfileStatsState>
        </ProfileSectionCard>
      </Box>
    );
  }

  return (
    <StyledLegendList
      key={listKey}
      className="flex-1"
      data={games}
      keyExtractor={getGameHistoryItemKey}
      refreshing={refreshing || (isStatsFetching && !isStatsLoading)}
      onRefresh={refreshAll}
      onEndReached={() => {
        if (!hasNextPage || isFetchingNextPage) {
          return;
        }

        void fetchNextPage();
      }}
      onEndReachedThreshold={0.35}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
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
      renderItem={({ item }) => <GameStatsCard game={item} />}
      ListFooterComponent={<ListPaginationFooter isLoadingMore={isFetchingNextPage} />}
      ListEmptyComponent={
        <ProfileSectionCard>
          <ListEmptyState
            title={t('rooms:statistics.emptyTitle')}
            description={t('rooms:statistics.emptyDescription')}
            icon="🎮"
          />
        </ProfileSectionCard>
      }
    />
  );
};
