import type { ComponentType, ReactElement } from 'react';

import type { LegendListProps } from '@legendapp/list/react-native';

import { ListEmptyState } from '@/components/ListEmptyState';
import { ListLoadingState } from '@/components/ListLoadingState';
import { ScreenContainer } from '@/components/ScreenContainer';
import { StyledLegendList } from '@/components/ui/interop';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';

type AdminDataListScreenProps<TItem> = {
  data: TItem[];
  emptyDescription: string;
  emptyIcon?: string;
  emptyTitle: string;
  keyExtractor: (item: TItem, index: number) => string;
  loading: boolean;
  loadingText: string;
  onEndReached?: (() => void) | null;
  onEndReachedThreshold?: number;
  onRefresh: () => void;
  refreshing: boolean;
  renderItem: NonNullable<LegendListProps<TItem>['renderItem']>;
  title: string;
  listFooterComponent?: ComponentType<object> | ReactElement | null;
  listKey?: string;
};

export const AdminDataListScreen = function AdminDataListScreen<TItem>({
  data,
  emptyDescription,
  emptyIcon,
  emptyTitle,
  keyExtractor,
  loading,
  loadingText,
  onEndReached,
  onEndReachedThreshold = 0.35,
  onRefresh,
  refreshing,
  renderItem,
  title,
  listFooterComponent,
  listKey,
}: AdminDataListScreenProps<TItem>) {
  if (loading && data.length === 0) {
    return (
      <ScreenContainer edges={['bottom']}>
        <ListLoadingState text={loadingText} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['bottom']}>
      <Text className="mb-lg px-1 text-lg font-semibold text-text-accent">{title}</Text>

      <StyledLegendList
        key={listKey}
        className="flex-1"
        contentContainerClassName={mergeClassNames(data.length === 0 && 'flex-1', 'pb-xl')}
        data={data}
        keyExtractor={keyExtractor}
        onEndReached={onEndReached ?? undefined}
        onEndReachedThreshold={onEndReached ? onEndReachedThreshold : undefined}
        onRefresh={onRefresh}
        refreshing={refreshing}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={listFooterComponent ?? null}
        ListEmptyComponent={
          <ListEmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} />
        }
      />
    </ScreenContainer>
  );
};
