import { ModalRouteFrame } from '@/components/ModalRouteFrame';
import { GameOverModal } from '@/screens/GameScreen/GameOverModal';

export default function GameOverRoute() {
  return (
    <ModalRouteFrame dismissible={false}>
      <GameOverModal />
    </ModalRouteFrame>
  );
}
