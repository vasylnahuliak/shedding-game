import { useAdminAccountDeletionRequestsQuery } from '@/api';

export const useAdminAccountDeletionRequests = () => {
  const { data, isLoading, isRefetching, refetch } = useAdminAccountDeletionRequestsQuery();
  const requests = data ?? [];

  const refreshRequests = async () => {
    await refetch();
  };

  return {
    requests,
    loading: isLoading,
    refreshing: isRefetching && !isLoading,
    refreshRequests,
  };
};
