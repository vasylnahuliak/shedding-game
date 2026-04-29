import type { Prisma } from '@prisma/client';
import type { AppLocale, AppRole } from '@shedding-game/shared';

import { prisma } from '@/db/client';
import { bumpCacheNamespace } from '@/services/cache';
import type { EmojiPreferences, User } from '@/types';

import {
  DELETED_ACCOUNT_NAME,
  ensureUserRole,
  findUserById,
  getRoleRecordOrThrow,
  mapUserFromDb,
  nowMsBigInt,
  relinkUserReferences,
  requirePersistedUser,
  saveSupabaseProfile,
  toEmojiPreferences,
  updateUser,
  userListSelect,
  userSelect,
  withExistingUser,
} from './userRepository.helpers';

export { DELETED_ACCOUNT_NAME } from './userRepository.helpers';

export const userRepository = {
  async findById(id: string): Promise<User | null> {
    return findUserById(prisma, id);
  },

  async upsertSupabaseProfile(params: {
    id: string;
    email: string;
    displayName: string;
    locale: AppLocale;
  }): Promise<User> {
    const now = nowMsBigInt();
    const normalizedEmail = params.email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (existing) {
      return prisma.$transaction((tx) =>
        saveSupabaseProfile(
          tx,
          {
            ...params,
            email: normalizedEmail,
          },
          now
        )
      );
    }

    const existingByEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingByEmail) {
      const user = await prisma.$transaction(async (tx) => {
        if (existingByEmail.id !== params.id) {
          await relinkUserReferences(tx, existingByEmail.id, params.id);
          await tx.$executeRaw`
            UPDATE "users"
            SET "id" = ${params.id}::uuid
            WHERE "id" = ${existingByEmail.id}::uuid
          `;
        }

        return saveSupabaseProfile(
          tx,
          {
            ...params,
            email: normalizedEmail,
          },
          now
        );
      });

      return user;
    }

    const user = await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: params.id,
          name: params.displayName,
          email: normalizedEmail,
          locale: params.locale,
          userType: 'human',
          createdAtMs: now,
          updatedAtMs: now,
        },
      });

      await ensureUserRole(tx, params.id, 'player');

      return requirePersistedUser(await findUserById(tx, params.id), params.id, 'created');
    });

    return user;
  },

  async updateDisplayName(userId: string, displayName: string): Promise<User | null> {
    return updateUser(userId, {
      name: displayName,
      updatedAtMs: nowMsBigInt(),
    });
  },

  async updateEmojiPreference(
    userId: string,
    reactionType: string,
    emoji: string
  ): Promise<User | null> {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        emojiPreferences: true,
      },
    });

    if (!currentUser) return null;

    const current = toEmojiPreferences(currentUser.emojiPreferences) ?? {};
    const updated: EmojiPreferences = { ...current, [reactionType]: emoji };

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        emojiPreferences: updated as Prisma.InputJsonValue,
        updatedAtMs: nowMsBigInt(),
      },
      select: userSelect,
    });

    return mapUserFromDb(user);
  },

  async updateLocale(userId: string, locale: AppLocale): Promise<User | null> {
    return updateUser(userId, {
      locale,
      updatedAtMs: nowMsBigInt(),
    });
  },

  async updateHapticsEnabled(userId: string, enabled: boolean): Promise<User | null> {
    return updateUser(userId, {
      hapticsEnabled: enabled,
      updatedAtMs: nowMsBigInt(),
    });
  },

  async updateDiscardPileExpandedByDefault(userId: string, enabled: boolean): Promise<User | null> {
    return updateUser(userId, {
      discardPileExpandedByDefault: enabled,
      updatedAtMs: nowMsBigInt(),
    } as Prisma.UserUpdateInput);
  },

  async anonymizeDeletedAccountReferences(userId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.roomPlayer.updateMany({
        where: { playerId: userId },
        data: {
          name: DELETED_ACCOUNT_NAME,
          isLeaver: true,
        },
      });

      await tx.closedGamePlayer.updateMany({
        where: { playerId: userId },
        data: {
          name: DELETED_ACCOUNT_NAME,
        },
      });

      await tx.room.updateMany({
        where: { winnerId: userId },
        data: {
          winnerName: DELETED_ACCOUNT_NAME,
        },
      });
    });

    await Promise.all([bumpCacheNamespace('rooms'), bumpCacheNamespace('stats')]);
  },

  async deleteById(userId: string): Promise<void> {
    await prisma.user.deleteMany({ where: { id: userId } });
  },

  async searchByNameOrEmail(query?: string): Promise<User[]> {
    const normalizedQuery = query?.trim();
    const users = await prisma.user.findMany({
      where: normalizedQuery
        ? {
            OR: [
              {
                name: {
                  contains: normalizedQuery,
                  mode: 'insensitive',
                },
              },
              {
                email: {
                  contains: normalizedQuery.toLowerCase(),
                  mode: 'insensitive',
                },
              },
            ],
          }
        : undefined,
      orderBy: [{ updatedAtMs: 'desc' }, { name: 'asc' }],
      take: 50,
      select: userListSelect,
    });

    return users.map(mapUserFromDb);
  },

  async assignRole(userId: string, role: AppRole): Promise<User | null> {
    return withExistingUser(userId, async (tx) => {
      await ensureUserRole(tx, userId, role);
    });
  },

  async removeRole(userId: string, role: AppRole): Promise<User | null> {
    return withExistingUser(userId, async (tx) => {
      const roleRecord = await getRoleRecordOrThrow(tx, role);

      await tx.userRole.deleteMany({
        where: {
          userId,
          roleId: roleRecord.id,
        },
      });
    });
  },
};
