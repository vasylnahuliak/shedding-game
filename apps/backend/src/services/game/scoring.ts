import type { Room } from '@/types';

export const getScoreMultiplier = (room: Room, isBridge: boolean): number => {
  const reshuffleBonus = room.reshuffleCount;
  const bridgeBonus = isBridge ? 1 : 0;

  return 1 + reshuffleBonus + bridgeBonus;
};
