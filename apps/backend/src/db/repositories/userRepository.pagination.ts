import type { Prisma } from '@prisma/client';

import { prisma } from '@/db/client';
import type { User } from '@/types';

import { mapUserFromDb, userListSelect } from './userRepository.helpers';

type UserListCursor = {
  updatedAt: number;
  id: string;
};

export type UserListPageOptions = {
  cursor?: string;
  limit: number;
  query?: string;
};

const decodeUserListCursor = (cursor?: string): UserListCursor | null => {
  if (!cursor) return null;

  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as unknown;

    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof (parsed as UserListCursor).updatedAt === 'number' &&
      typeof (parsed as UserListCursor).id === 'string'
    ) {
      return parsed as UserListCursor;
    }
  } catch {
    return null;
  }

  return null;
};

const encodeUserListCursor = (cursor: UserListCursor): string =>
  Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');

export const buildUserSearchWhere = (query?: string): Prisma.UserWhereInput | undefined => {
  const normalizedQuery = query?.trim();

  return normalizedQuery
    ? {
        OR: [
          { name: { contains: normalizedQuery, mode: 'insensitive' } },
          { email: { contains: normalizedQuery.toLowerCase(), mode: 'insensitive' } },
        ],
      }
    : undefined;
};

const buildUserListCursorWhere = (
  cursor: UserListCursor | null
): Prisma.UserWhereInput | undefined => {
  if (!cursor) return undefined;

  return {
    OR: [
      { updatedAtMs: { lt: BigInt(cursor.updatedAt) } },
      { updatedAtMs: BigInt(cursor.updatedAt), id: { lt: cursor.id } },
    ],
  };
};

export const searchUserPageByNameOrEmail = async (
  options: UserListPageOptions
): Promise<{ hasMore: boolean; nextCursor?: string; totalCount: number; users: User[] }> => {
  const clauses = [
    buildUserSearchWhere(options.query),
    buildUserListCursorWhere(decodeUserListCursor(options.cursor)),
  ].filter((clause): clause is Prisma.UserWhereInput => clause != null);
  const resolvedWhere: Prisma.UserWhereInput | undefined =
    clauses.length > 0 ? { AND: clauses } : undefined;

  const [totalCount, records] = await Promise.all([
    prisma.user.count({ where: buildUserSearchWhere(options.query) }),
    prisma.user.findMany({
      where: resolvedWhere,
      orderBy: [{ updatedAtMs: 'desc' }, { id: 'desc' }],
      take: options.limit + 1,
      select: userListSelect,
    }),
  ]);
  const pageRecords = records.slice(0, options.limit);
  const lastRecord = pageRecords[pageRecords.length - 1];
  const hasMore = records.length > options.limit;

  return {
    users: pageRecords.map(mapUserFromDb),
    totalCount,
    hasMore,
    nextCursor:
      hasMore && lastRecord
        ? encodeUserListCursor({ updatedAt: Number(lastRecord.updatedAtMs), id: lastRecord.id })
        : undefined,
  };
};
