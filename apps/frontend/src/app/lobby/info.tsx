import { useLocalSearchParams } from 'expo-router';

import { modalContentNarrowClassName } from '@/components/Modal';
import { ModalRouteFrame } from '@/components/ModalRouteFrame';
import { appRoutes } from '@/navigation/appRoutes';
import { useModalDismiss } from '@/navigation/useModalDismiss';
import { LobbyInfoModalContent } from '@/screens/LobbyScreen/components/LobbyInfoModal';

export default function LobbyInfoRoute() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const onClose = useModalDismiss(roomId ? appRoutes.lobby({ roomId }) : appRoutes.home);

  return (
    <ModalRouteFrame onRequestClose={onClose} contentClassName={modalContentNarrowClassName}>
      <LobbyInfoModalContent onClose={onClose} />
    </ModalRouteFrame>
  );
}
