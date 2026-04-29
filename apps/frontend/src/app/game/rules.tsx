import { GameManualModalRouteFrame } from '@/screens/GameScreen/GameManualModalRouteFrame';
import { RulesModal } from '@/screens/GameScreen/RulesModal';

export default function GameRulesRoute() {
  return (
    <GameManualModalRouteFrame>
      {(onClose) => <RulesModal onClose={onClose} />}
    </GameManualModalRouteFrame>
  );
}
