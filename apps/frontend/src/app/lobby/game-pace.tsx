import { DEFAULT_GAME_PACE } from '@shedding-game/shared';

import { ModalRouteFrame } from '@/components/ModalRouteFrame';
import { GamePaceDetailsModalContent } from '@/screens/LobbyScreen/components/GamePaceCard';
import { roomOptionModalContentClassName } from '@/screens/LobbyScreen/components/roomOptionCardStyles';
import { useLobbyModalRoute } from '@/screens/LobbyScreen/useLobbyModalRoute';

export default function LobbyGamePaceRoute() {
  const { roomId, room, isHostUser, onClose } = useLobbyModalRoute();

  return (
    <ModalRouteFrame onRequestClose={onClose} contentClassName={roomOptionModalContentClassName}>
      <GamePaceDetailsModalContent
        gamePace={room?.gamePace ?? DEFAULT_GAME_PACE}
        roomId={roomId ?? ''}
        isHostUser={isHostUser}
        onClose={onClose}
      />
    </ModalRouteFrame>
  );
}
