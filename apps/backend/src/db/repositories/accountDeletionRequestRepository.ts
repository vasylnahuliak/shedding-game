import type { AppLocale } from '@shedding-game/shared';

import { prisma } from '@/db/client';

const nowMsBigInt = () => BigInt(Date.now());

type CreateAccountDeletionRequestParams = {
  requestId: string;
  email: string;
  userId: string | null;
  displayName: string | null;
  notes: string | null;
  locale: string;
  source: string;
};

type AccountDeletionRequestRecord = {
  requestId: string;
  email: string;
  userId?: string;
  displayName?: string;
  notes?: string;
  locale: AppLocale;
  source: string;
  createdAt: number;
};

export const accountDeletionRequestRepository = {
  async create(params: CreateAccountDeletionRequestParams): Promise<void> {
    await prisma.accountDeletionRequest.create({
      data: {
        requestId: params.requestId,
        email: params.email,
        userId: params.userId,
        displayName: params.displayName,
        notes: params.notes,
        locale: params.locale,
        source: params.source,
        createdAtMs: nowMsBigInt(),
      },
    });
  },

  async listRecent(limit = 100): Promise<AccountDeletionRequestRecord[]> {
    const requests = await prisma.accountDeletionRequest.findMany({
      orderBy: {
        createdAtMs: 'desc',
      },
      take: limit,
      select: {
        requestId: true,
        email: true,
        userId: true,
        displayName: true,
        notes: true,
        locale: true,
        source: true,
        createdAtMs: true,
      },
    });

    return requests.map((request) => ({
      requestId: request.requestId,
      email: request.email,
      userId: request.userId ?? undefined,
      displayName: request.displayName ?? undefined,
      notes: request.notes ?? undefined,
      locale: request.locale as AppLocale,
      source: request.source,
      createdAt: Number(request.createdAtMs),
    }));
  },
};
