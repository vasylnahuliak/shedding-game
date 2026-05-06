import { Prisma } from '@prisma/client';
import type { AppLocale, AppRole, SuitDisplayMode } from '@shedding-game/shared';

import {
  DEFAULT_SUIT_DISPLAY_MODE,
  resolveAppLocale,
  SUIT_DISPLAY_MODES,
} from '@shedding-game/shared';

import { prisma } from '@/db/client';
import type { EmojiPreferences, User } from '@/types';

export const toEmojiPreferences = (
  value: Prisma.JsonValue | null
): EmojiPreferences | undefined => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const prefs: EmojiPreferences = {};
  for (const [key, raw] of Object.entries(value)) {
    if (typeof raw === 'string') {
      prefs[key] = raw;
    }
  }

  return Object.keys(prefs).length > 0 ? prefs : undefined;
};

export const mapUserFromDb = (record: {
  id: string;
  name: string;
  email: string;
  locale: string;
  userType: 'human' | 'bot';
  hapticsEnabled: boolean;
  discardPileExpandedByDefault: boolean;
  suitDisplayMode: string;
  createdAtMs: bigint;
  updatedAtMs: bigint;
  emojiPreferences: Prisma.JsonValue | null;
  roles: Array<{
    role: {
      name: AppRole;
    };
  }>;
}): User => ({
  id: record.id,
  name: record.name,
  email: record.email,
  locale: resolveAppLocale(record.locale),
  userType: record.userType,
  hapticsEnabled: record.hapticsEnabled,
  discardPileExpandedByDefault: record.discardPileExpandedByDefault,
  suitDisplayMode: SUIT_DISPLAY_MODES.includes(record.suitDisplayMode as SuitDisplayMode)
    ? (record.suitDisplayMode as SuitDisplayMode)
    : DEFAULT_SUIT_DISPLAY_MODE,
  roles: record.roles.map(({ role }) => role.name),
  emojiPreferences: toEmojiPreferences(record.emojiPreferences),
  createdAt: Number(record.createdAtMs),
  updatedAt: Number(record.updatedAtMs),
});

export const nowMsBigInt = () => BigInt(Date.now());
export const DELETED_ACCOUNT_NAME = 'Deleted user';

export const userSelect = {
  id: true,
  name: true,
  email: true,
  locale: true,
  userType: true,
  hapticsEnabled: true,
  discardPileExpandedByDefault: true,
  suitDisplayMode: true,
  createdAtMs: true,
  updatedAtMs: true,
  emojiPreferences: true,
  roles: {
    select: {
      role: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      role: {
        name: 'asc',
      },
    },
  },
} as const;

export const userListSelect = {
  ...userSelect,
} as const;

export const getRoleRecordOrThrow = async (
  tx: Prisma.TransactionClient,
  role: AppRole
): Promise<{ id: number }> => {
  const roleRecord = await tx.role.findUnique({
    where: { name: role },
    select: { id: true },
  });

  if (!roleRecord) {
    throw new Error(`Role "${role}" is not seeded.`);
  }

  return roleRecord;
};

export const ensureUserRole = async (
  tx: Prisma.TransactionClient,
  userId: string,
  role: AppRole
): Promise<void> => {
  const roleRecord = await getRoleRecordOrThrow(tx, role);

  await tx.userRole.upsert({
    where: {
      userId_roleId: {
        userId,
        roleId: roleRecord.id,
      },
    },
    create: {
      userId,
      roleId: roleRecord.id,
      assignedAtMs: nowMsBigInt(),
    },
    update: {},
  });
};

const buildSupabaseProfileUpdateData = (
  displayName: string,
  email: string,
  locale: AppLocale,
  updatedAtMs: bigint
): Prisma.UserUpdateInput => ({
  name: displayName,
  email,
  locale,
  userType: 'human',
  updatedAtMs,
});

export const relinkUserReferences = async (
  tx: Prisma.TransactionClient,
  previousUserId: string,
  nextUserId: string
) => {
  await Promise.all([
    tx.roomPlayer.updateMany({
      where: { playerId: previousUserId },
      data: { playerId: nextUserId },
    }),
    tx.roomCard.updateMany({
      where: { ownerPlayerId: previousUserId },
      data: { ownerPlayerId: nextUserId },
    }),
    tx.roomReadyPlayer.updateMany({
      where: { playerId: previousUserId },
      data: { playerId: nextUserId },
    }),
    tx.roomRoundEntry.updateMany({
      where: { playerId: previousUserId },
      data: { playerId: nextUserId },
    }),
    tx.closedGame.updateMany({
      where: { hostId: previousUserId },
      data: { hostId: nextUserId },
    }),
    tx.closedGamePlayer.updateMany({
      where: { playerId: previousUserId },
      data: { playerId: nextUserId },
    }),
  ]);

  await tx.room.updateMany({
    where: { winnerId: previousUserId },
    data: { winnerId: nextUserId },
  });

  await tx.room.updateMany({
    where: { bridgePlayerId: previousUserId },
    data: { bridgePlayerId: nextUserId },
  });
};

export const updateUser = async (
  userId: string,
  data: Prisma.UserUpdateInput
): Promise<User | null> => {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: userSelect,
    });

    return mapUserFromDb(user);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return null;
    }

    throw error;
  }
};

export const findUserById = async (
  client: Prisma.TransactionClient | typeof prisma,
  id: string
): Promise<User | null> => {
  const user = await client.user.findUnique({
    where: { id },
    select: userSelect,
  });

  return user ? mapUserFromDb(user) : null;
};

const findExistingUserId = async (
  client: Prisma.TransactionClient | typeof prisma,
  userId: string
): Promise<string | null> => {
  const user = await client.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  return user?.id ?? null;
};

export const requirePersistedUser = (user: User | null, userId: string, action: string): User => {
  if (!user) {
    throw new Error(`User "${userId}" was ${action} but could not be reloaded.`);
  }

  return user;
};

export const saveSupabaseProfile = async (
  tx: Prisma.TransactionClient,
  params: {
    id: string;
    email: string;
    displayName: string;
    locale: AppLocale;
  },
  updatedAtMs: bigint
): Promise<User> => {
  await tx.user.update({
    where: { id: params.id },
    data: buildSupabaseProfileUpdateData(
      params.displayName,
      params.email,
      params.locale,
      updatedAtMs
    ),
  });

  await ensureUserRole(tx, params.id, 'player');

  return requirePersistedUser(await findUserById(tx, params.id), params.id, 'saved');
};

export const withExistingUser = async (
  userId: string,
  action: (tx: Prisma.TransactionClient) => Promise<void>
): Promise<User | null> => {
  return prisma.$transaction(async (tx) => {
    const existingUserId = await findExistingUserId(tx, userId);
    if (!existingUserId) {
      return null;
    }

    await action(tx);

    return findUserById(tx, existingUserId);
  });
};
