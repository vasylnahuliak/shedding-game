import { ModalRouteFrame } from '@/components/ModalRouteFrame';
import { RoundOverModal } from '@/screens/GameScreen/RoundOverModal';

export default function GameRoundOverRoute() {
  return (
    <ModalRouteFrame dismissible={false}>
      <RoundOverModal />
    </ModalRouteFrame>
  );
}
