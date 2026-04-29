import type { Request, Response } from 'express';

import { parseWithSchema, UserStatsSchema } from '@shedding-game/shared';

import { getUserStatsSummary } from '@/services/room';
import type { AuthedRequest } from '@/types';
import { resolveGameHistoryFilters } from '@/utils/gameHistory';

export const getMyStats = async (req: Request, res: Response) => {
  const userId = (req as AuthedRequest).userId;
  const stats = await getUserStatsSummary(
    userId,
    resolveGameHistoryFilters({
      playerTypeFilter: req.query.playerTypeFilter,
      gameStatusFilter: req.query.gameStatusFilter,
    })
  );

  res.json(parseWithSchema(UserStatsSchema, stats));
};
