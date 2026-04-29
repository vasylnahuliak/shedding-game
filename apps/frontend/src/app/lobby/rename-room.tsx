import { modalContentNarrowClassName } from '@/components/Modal';
import { ModalRouteFrame } from '@/components/ModalRouteFrame';
import { RenameRoomModalContent } from '@/screens/LobbyScreen/components/RenameRoomModal';
import { useLobbyModalRoute } from '@/screens/LobbyScreen/useLobbyModalRoute';

export default function LobbyRenameRoomRoute() {
  const { roomId, room, isHostUser, onClose } = useLobbyModalRoute();

  if (!isHostUser) {
    onClose();
    return null;
  }

  return (
    <ModalRouteFrame onRequestClose={onClose} contentClassName={modalContentNarrowClassName}>
      <RenameRoomModalContent roomId={roomId} currentName={room?.name ?? ''} onClose={onClose} />
    </ModalRouteFrame>
  );
}
