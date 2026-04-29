import { MAX_PLAYERS } from '@shedding-game/shared';

import type { RoomDetails } from '@/types/rooms';

export const getLobbyDerivedState = (
  room: RoomDetails | null | undefined,
  userId: string | undefined
) => {
  const hostId = room?.hostId ?? null;
  const playerCount = room?.players.length ?? 0;
  const isHostUser = hostId != null && userId ? hostId === userId : false;

  return {
    hostId,
    isHostUser,
    playerCount,
    canStartGame: isHostUser && playerCount >= 2 && playerCount <= MAX_PLAYERS,
    needsMorePlayers: playerCount < 2,
    roomIsFull: playerCount >= MAX_PLAYERS,
  };
};
