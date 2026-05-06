import type {
  AdminUserSummaryPage,
  AppRole,
  GameHistoryFilters,
  GameHistoryPage,
} from '@shedding-game/shared';
import {
  infiniteQueryOptions,
  keepPreviousData,
  queryOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { AdminService } from '@/services/AdminService';

import { selectGameHistoryInfiniteData } from '../gameHistory.selectors';
import { adminKeys } from '../query-keys';

const ADMIN_USERS_PAGE_SIZE = 20;
const ADMIN_USER_GAMES_PAGE_SIZE = 20;
const ADMIN_USERS_STALE_TIME_MS = 30 * 1000;

const adminQueries = {
  accountDeletionRequests: () =>
    queryOptions({
      queryKey: adminKeys.accountDeletionRequests(),
      queryFn: () => AdminService.getAccountDeletionRequests(),
      staleTime: 2 * 60 * 1000, // 2 minutes — admin data is relatively static
    }),
  users: (query: string) =>
    infiniteQueryOptions({
      queryKey: adminKeys.userList(query),
      initialPageParam: undefined as string | undefined,
      queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
        AdminService.getUsers({
          query,
          limit: ADMIN_USERS_PAGE_SIZE,
          cursor: pageParam,
        }),
      getNextPageParam: (lastPage: AdminUserSummaryPage) => lastPage.nextCursor ?? undefined,
      maxPages: 10,
      placeholderData: keepPreviousData,
      staleTime: ADMIN_USERS_STALE_TIME_MS,
    }),
  userGames: (userId: string, filters: GameHistoryFilters) =>
    infiniteQueryOptions({
      queryKey: adminKeys.userGames(userId, filters),
      initialPageParam: undefined as string | undefined,
      queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
        AdminService.getUserGames(userId, {
          limit: ADMIN_USER_GAMES_PAGE_SIZE,
          cursor: pageParam,
          filters,
        }),
      getNextPageParam: (lastPage: GameHistoryPage) => lastPage.nextCursor ?? undefined,
      maxPages: 10,
      enabled: !!userId,
    }),
  userStats: (userId: string, filters: GameHistoryFilters) =>
    queryOptions({
      queryKey: adminKeys.userStats(userId, filters),
      queryFn: () => AdminService.getUserStats(userId, filters),
      enabled: !!userId,
      staleTime: 30 * 1000,
    }),
};

export const useAdminAccountDeletionRequestsQuery = () => {
  return useQuery(adminQueries.accountDeletionRequests());
};

export const useAdminUsersQuery = (query: string) => {
  return useInfiniteQuery({
    ...adminQueries.users(query),
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      users: data.pages.flatMap((page) => page.users),
      totalCount: data.pages[0]?.totalCount ?? 0,
    }),
  });
};

export const useAdminUserGamesQuery = (userId: string, filters: GameHistoryFilters) => {
  return useInfiniteQuery({
    ...adminQueries.userGames(userId, filters),
    select: selectGameHistoryInfiniteData,
  });
};

export const useAdminUserStatsQuery = (userId: string, filters: GameHistoryFilters) => {
  return useQuery(adminQueries.userStats(userId, filters));
};

type UpdateAdminUserRoleVariables = {
  role: AppRole;
  userId: string;
};

export const useAssignAdminUserRoleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ role, userId }: UpdateAdminUserRoleVariables) =>
      AdminService.assignUserRole(userId, role),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
};

export const useRemoveAdminUserRoleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ role, userId }: UpdateAdminUserRoleVariables) =>
      AdminService.removeUserRole(userId, role),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
};
