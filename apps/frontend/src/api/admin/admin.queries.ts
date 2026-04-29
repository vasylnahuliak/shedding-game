import { queryOptions, useQuery } from '@tanstack/react-query';

import { AdminService } from '@/services/AdminService';

import { adminKeys } from '../query-keys';

const adminQueries = {
  accountDeletionRequests: () =>
    queryOptions({
      queryKey: adminKeys.accountDeletionRequests(),
      queryFn: () => AdminService.getAccountDeletionRequests(),
      staleTime: 2 * 60 * 1000, // 2 minutes — admin data is relatively static
    }),
};

export const useAdminAccountDeletionRequestsQuery = () => {
  return useQuery(adminQueries.accountDeletionRequests());
};
