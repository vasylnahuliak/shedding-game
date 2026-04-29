import type { AppRole } from '@shedding-game/shared';
import type { Request, Response } from 'express';

import {
  AppRoleSchema,
  AssignUserRoleRequestSchema,
  safeParseWithSchema,
} from '@shedding-game/shared';

import { accountDeletionRequestRepository } from '@/db/repositories/accountDeletionRequestRepository';
import { userRepository } from '@/db/repositories/userRepository';
import { sanitizeUser } from '@/services/auth';
import { apiError } from '@/services/messages';
import type { AuthedRequest } from '@/types';

type ManagedRole = Exclude<AppRole, 'player'>;

const isManagedRole = (role: AppRole): role is ManagedRole => role !== 'player';

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

  const users = await userRepository.searchByNameOrEmail(query);
  res.json({ users: users.map((user) => sanitizeUser(user)) });
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
