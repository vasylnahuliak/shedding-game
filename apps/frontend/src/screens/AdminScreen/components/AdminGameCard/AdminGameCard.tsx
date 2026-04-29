import { GameStatsCard } from '@/components/GameStatsCard';

import type { AdminGameCardProps } from './AdminGameCard.types';

export const AdminGameCard = function AdminGameCard({ game }: AdminGameCardProps) {
  return <GameStatsCard game={game} />;
};
