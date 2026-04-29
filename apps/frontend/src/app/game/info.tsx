import { GameManualModalRouteFrame } from '@/screens/GameScreen/GameManualModalRouteFrame';
import { InfoModal } from '@/screens/GameScreen/InfoModal';

export default function GameInfoRoute() {
  return (
    <GameManualModalRouteFrame>
      {(onClose) => <InfoModal onClose={onClose} />}
    </GameManualModalRouteFrame>
  );
}
