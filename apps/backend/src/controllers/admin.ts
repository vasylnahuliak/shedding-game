import type { AppRole } from '@shedding-game/shared';
import type { Request, Response } from 'express';

import {
  AdminUserSummaryPageSchema,
  AppRoleSchema,
  AssignUserRoleRequestSchema,
  parseWithSchema,
  safeParseWithSchema,
  UserStatsSchema,
} from '@shedding-game/shared';

import { accountDeletionRequestRepository } from '@/db/repositories/accountDeletionRequestRepository';
import { userRepository } from '@/db/repositories/userRepository';
import { sanitizeUser } from '@/services/auth';
import { apiError } from '@/services/messages';
import { getGamesPage, getUserStatsSummary } from '@/services/room';
import type { AuthedRequest } from '@/types';
import {
  resolveBoundedPageLimit,
  resolveGameHistoryCursor,
  resolveGameHistoryFilters,
  resolveGameHistoryPageOptions,
} from '@/utils/gameHistory';

type ManagedRole = Exclude<AppRole, 'player'>;

const DEFAULT_USER_LIST_PAGE_LIMIT = 20;
const MAX_USER_LIST_PAGE_LIMIT = 50;

const isManagedRole = (role: AppRole): role is ManagedRole => role !== 'player';

const resolveUserListLimit = (rawLimit: unknown): number => {
  return resolveBoundedPageLimit(rawLimit, DEFAULT_USER_LIST_PAGE_LIMIT, MAX_USER_LIST_PAGE_LIMIT);
};

const parseManagedRole = (
  req: Request,
  res: Response,
  rawRole: unknown
): { ok: true; role: ManagedRole } | { ok: false } => {
  const authedReq = req as AuthedRequest;
  const roleResult = safeParseWithSchema(AppRoleSchema, rawRole);

  if (!roleResult.success) {
    apiError(res, authedReq.locale, 400, 'AUTH_INVALID_ROLE');
    return { ok: false };
  }

  const role = roleResult.output;
  if (!isManagedRole(role)) {
    apiError(res, authedReq.locale, 400, 'AUTH_ROLE_ASSIGNMENT_NOT_ALLOWED');
    return { ok: false };
  }

  return { ok: true, role };
};

const respondWithManagedUser = (
  req: Request,
  res: Response,
  user: Awaited<ReturnType<typeof userRepository.assignRole>>
) => {
  const authedReq = req as AuthedRequest;
  if (!user) {
    apiError(res, authedReq.locale, 404, 'AUTH_USER_NOT_FOUND');
    return false;
  }

  res.json({ user: sanitizeUser(user) });
  return true;
};

export const listUsers = async (req: Request, res: Response) => {
  const queryParam = req.query.query;
  const query = typeof queryParam === 'string' ? queryParam : undefined;

  const page = await userRepository.searchPageByNameOrEmail({
    query,
    limit: resolveUserListLimit(req.query.limit),
    cursor: resolveGameHistoryCursor(req.query.cursor),
  });

  res.json(
    parseWithSchema(AdminUserSummaryPageSchema, {
      ...page,
      users: page.users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        locale: user.locale,
        roles: user.roles,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
    })
  );
};

export const getUserGames = async (req: Request, res: Response) => {
  res.json(await getGamesPage(String(req.params.userId), resolveGameHistoryPageOptions(req.query)));
};

export const getUserStats = async (req: Request, res: Response) => {
  const stats = await getUserStatsSummary(
    String(req.params.userId),
    resolveGameHistoryFilters({
      playerTypeFilter: req.query.playerTypeFilter,
      gameStatusFilter: req.query.gameStatusFilter,
    })
  );

  res.json(parseWithSchema(UserStatsSchema, stats));
};

export const listAccountDeletionRequests = async (_req: Request, res: Response) => {
  const requests = await accountDeletionRequestRepository.listRecent();
  res.json({ requests });
};

export const assignRole = async (req: Request, res: Response) => {
  const result = safeParseWithSchema(AssignUserRoleRequestSchema, req.body);

  if (!result.success) {
    apiError(res, (req as AuthedRequest).locale, 400, 'AUTH_INVALID_ROLE');
    return;
  }

  const parsedRole = parseManagedRole(req, res, result.output.role);
  if (!parsedRole.ok) {
    return;
  }

  const user = await userRepository.assignRole(String(req.params.userId), parsedRole.role);
  respondWithManagedUser(req, res, user);
};

export const removeRole = async (req: Request, res: Response) => {
  const parsedRole = parseManagedRole(req, res, req.params.role);
  if (!parsedRole.ok) {
    return;
  }

  const user = await userRepository.removeRole(String(req.params.userId), parsedRole.role);
  respondWithManagedUser(req, res, user);
};
