import type { AdminAccountDeletionRequest } from '@shedding-game/shared';

import { AdminAccountDeletionRequestListResponseSchema } from '@shedding-game/shared';

import { parseApiResponse } from './contractValidation';
import { api } from './index';

const getAccountDeletionRequests = async (): Promise<AdminAccountDeletionRequest[]> => {
  const response = await api.get('admin/account-deletion-requests');
  const data = await parseApiResponse(
    response,
    AdminAccountDeletionRequestListResponseSchema,
    'GET admin/account-deletion-requests'
  );

  return data.requests;
};

export const AdminService = {
  getAccountDeletionRequests,
};
