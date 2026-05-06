import type { ReactElement } from 'react';

import type { AdminGame } from '@shedding-game/shared';

import { GameStatsCard } from '@/components/GameStatsCard';
import { ListEmptyState } from '@/components/ListEmptyState';
import { ListPaginationFooter } from '@/components/ListPaginationFooter';
import { ProfileSectionCard } from '@/components/ProfileSectionCard';
import { StyledLegendList } from '@/components/ui/interop';
import { getGameHistoryItemKey } from '@/utils/gameHistory';

type GameHistoryStatsListProps = {
  emptyDescription: string;
  emptyTitle: string;
  fetchNextPage: () => void;
  games: AdminGame[];
  hasNextPage: boolean;
  headerComponent: ReactElement;
  isFetchingNextPage: boolean;
  listKey: string;
  onRefresh: () => void | Promise<void>;
  refreshing: boolean;
};

export const GameHistoryStatsList = function GameHistoryStatsList({
  emptyDescription,
  emptyTitle,
  fetchNextPage,
  games,
  hasNextPage,
  headerComponent,
  isFetchingNextPage,
  listKey,
  onRefresh,
  refreshing,
}: GameHistoryStatsListProps) {
  return (
    <StyledLegendList
      key={listKey}
      className="flex-1"
      data={games}
      keyExtractor={getGameHistoryItemKey}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onEndReached={() => {
        if (!hasNextPage || isFetchingNextPage) {
          return;
        }

        fetchNextPage();
      }}
      onEndReachedThreshold={0.35}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={headerComponent}
      renderItem={({ item }) => <GameStatsCard game={item} />}
      ListFooterComponent={<ListPaginationFooter isLoadingMore={isFetchingNextPage} />}
      ListEmptyComponent={
        <ProfileSectionCard>
          <ListEmptyState title={emptyTitle} description={emptyDescription} icon="🎮" />
        </ProfileSectionCard>
      }
    />
  );
};
