import type {
  AdminAccountDeletionRequest,
  AdminUserSummaryPage,
  GameHistoryFilters,
  GameHistoryPage,
  UserStats,
} from '@shedding-game/shared';

import {
  AdminAccountDeletionRequestListResponseSchema,
  AdminUserSummaryPageSchema,
  GameHistoryPageSchema,
  UserStatsSchema,
} from '@shedding-game/shared';

import { parseApiResponse } from './contractValidation';
import {
  addCursorPaginationSearchParams,
  buildGameHistorySearchParams,
} from './gameHistorySearchParams';
import { api } from './index';

type GetAdminUsersOptions = {
  cursor?: string;
  limit?: number;
  query?: string;
};

type GetAdminUserGamesOptions = {
  cursor?: string;
  filters?: GameHistoryFilters;
  limit?: number;
};

const buildAdminUsersSearchParams = (options: GetAdminUsersOptions = {}) => {
  const searchParams: Record<string, string> = {};

  if (options.query?.trim()) {
    searchParams.query = options.query.trim();
  }

  return addCursorPaginationSearchParams(searchParams, options);
};

const getAccountDeletionRequests = async (): Promise<AdminAccountDeletionRequest[]> => {
  const response = await api.get('admin/account-deletion-requests');
  const data = await parseApiResponse(
    response,
    AdminAccountDeletionRequestListResponseSchema,
    'GET admin/account-deletion-requests'
  );

  return data.requests;
};

const getUsers = async (options: GetAdminUsersOptions = {}): Promise<AdminUserSummaryPage> => {
  const response = await api.get('admin/users', {
    searchParams: buildAdminUsersSearchParams(options),
  });

  return parseApiResponse(response, AdminUserSummaryPageSchema, 'GET admin/users');
};

const getUserGames = async (
  userId: string,
  options: GetAdminUserGamesOptions = {}
): Promise<GameHistoryPage> => {
  const response = await api.get(`admin/users/${userId}/games`, {
    searchParams: buildGameHistorySearchParams(options),
  });

  return parseApiResponse(response, GameHistoryPageSchema, 'GET admin/users/:userId/games');
};

const getUserStats = async (userId: string, filters?: GameHistoryFilters): Promise<UserStats> => {
  const response = await api.get(`admin/users/${userId}/stats`, {
    searchParams: buildGameHistorySearchParams({ filters }),
  });

  return parseApiResponse(response, UserStatsSchema, 'GET admin/users/:userId/stats');
};

export const AdminService = {
  getAccountDeletionRequests,
  getUsers,
  getUserGames,
  getUserStats,
};
