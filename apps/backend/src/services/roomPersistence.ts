import type { BackendMessageCode } from '@shedding-game/shared';

import { closedGameRepository } from '@/db/repositories/closedGameRepository';
import { roomRepository } from '@/db/repositories/roomRepository';
import type { Room } from '@/types';

const FINISHED_REASON: BackendMessageCode = 'ROOM_CLOSED_FINISHED';

export const saveRoomWithAutoArchive = async (
  room: Room,
  previousStatus?: Room['gameStatus']
): Promise<void> => {
  if (previousStatus && previousStatus !== 'finished' && room.gameStatus === 'finished') {
    await closedGameRepository.archiveRoom(room, FINISHED_REASON);
  }

  await roomRepository.saveRoom(room);
};
