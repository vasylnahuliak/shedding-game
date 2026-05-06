import { useKeyboardState } from 'react-native-keyboard-controller';

import { FormInput } from '@/components/FormInput';
import { ListEmptyState } from '@/components/ListEmptyState';
import { ListLoadingState } from '@/components/ListLoadingState';
import { ListPaginationFooter } from '@/components/ListPaginationFooter';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Box } from '@/components/ui/box';
import { StyledLegendList } from '@/components/ui/interop';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { useAppTranslation } from '@/i18n';

import { AdminUserCard } from './components/AdminUserCard';
import { useAdminUsers } from './hooks/useAdminUsers';

export const AdminUsersScreen = () => {
  const { t } = useAppTranslation('admin');
  const {
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    loading,
    refreshUsers,
    refreshing,
    searchQuery,
    settledSearchQuery,
    setSearchQuery,
    totalCount,
    users,
  } = useAdminUsers();
  const hasSearchQuery = settledSearchQuery.length > 0;
  const keyboardHeight = useKeyboardState((state) => state.height);

  if (loading && users.length === 0) {
    return (
      <ScreenContainer edges={['bottom']}>
        <ListLoadingState text={t('usersScreen.loading')} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['bottom']}>
      <FormInput
        label={t('usersScreen.searchLabel')}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder={t('usersScreen.searchPlaceholder')}
        autoCapitalize="none"
        autoCorrect={false}
        spacing="compact"
        returnKeyType="search"
      />

      <Text className="mb-lg px-1 text-lg font-semibold text-text-accent">
        {t('usersScreen.allUsers', { count: totalCount })}
      </Text>

      <StyledLegendList
        className="flex-1"
        contentContainerClassName={mergeClassNames(users.length === 0 && 'flex-1', 'pb-xl')}
        data={users}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        onEndReached={() => {
          if (!hasNextPage || isFetchingNextPage) {
            return;
          }

          void fetchNextPage();
        }}
        onEndReachedThreshold={0.35}
        onRefresh={refreshUsers}
        refreshing={refreshing}
        renderItem={({ item }) => <AdminUserCard user={item} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <ListEmptyState
            title={t(hasSearchQuery ? 'usersScreen.emptySearchTitle' : 'usersScreen.emptyTitle')}
            description={t(
              hasSearchQuery ? 'usersScreen.emptySearchDescription' : 'usersScreen.emptyDescription'
            )}
            icon="👥"
          />
        }
        ListFooterComponent={
          <>
            <ListPaginationFooter isLoadingMore={isFetchingNextPage} />
            <Box style={{ height: keyboardHeight }} />
          </>
        }
      />
    </ScreenContainer>
  );
};
