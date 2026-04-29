import { ModalRouteFrame } from '@/components/ModalRouteFrame';
import { BridgeModal } from '@/screens/GameScreen/BridgeModal';

export default function GameBridgeRoute() {
  return (
    <ModalRouteFrame dismissible={false}>
      <BridgeModal />
    </ModalRouteFrame>
  );
}
