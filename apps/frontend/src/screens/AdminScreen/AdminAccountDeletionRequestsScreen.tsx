import { useAppTranslation } from '@/i18n';

import { AccountDeletionRequestCard } from './components/AccountDeletionRequestCard';
import { AdminDataListScreen } from './components/AdminDataListScreen';
import { useAdminAccountDeletionRequests } from './hooks/useAdminAccountDeletionRequests';

export const AdminAccountDeletionRequestsScreen = () => {
  const { t } = useAppTranslation('admin');
  const { loading, refreshing, refreshRequests, requests } = useAdminAccountDeletionRequests();

  return (
    <AdminDataListScreen
      data={requests}
      emptyDescription={t('requestsScreen.emptyDescription')}
      emptyIcon="📭"
      emptyTitle={t('requestsScreen.emptyTitle')}
      keyExtractor={(item) => item.requestId}
      loading={loading}
      loadingText={t('requestsScreen.loading')}
      onRefresh={refreshRequests}
      refreshing={refreshing}
      renderItem={({ item }) => <AccountDeletionRequestCard request={item} />}
      title={t('requestsScreen.allRequests', { count: requests.length })}
    />
  );
};
