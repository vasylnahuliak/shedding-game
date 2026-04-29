import { ModalRouteFrame } from '@/components/ModalRouteFrame';
import { useCanAccessAdmin } from '@/hooks';
import { DebugModeDetailsModalContent } from '@/screens/LobbyScreen/components/DebugModeCard';
import { roomOptionModalContentClassName } from '@/screens/LobbyScreen/components/roomOptionCardStyles';
import { useLobbyModalRoute } from '@/screens/LobbyScreen/useLobbyModalRoute';

export default function LobbyDebugModeRoute() {
  const { roomId, room, isHostUser, onClose } = useLobbyModalRoute();
  const canAccessAdmin = useCanAccessAdmin();

  if (!canAccessAdmin) {
    onClose();
    return null;
  }

  return (
    <ModalRouteFrame onRequestClose={onClose} contentClassName={roomOptionModalContentClassName}>
      <DebugModeDetailsModalContent
        debugMode={room?.debugMode ?? 'none'}
        roomId={roomId ?? ''}
        isHostUser={isHostUser}
        onClose={onClose}
      />
    </ModalRouteFrame>
  );
}
