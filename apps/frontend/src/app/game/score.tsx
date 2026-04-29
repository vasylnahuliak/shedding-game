import { ModalRouteFrame } from '@/components/ModalRouteFrame';
import { ScoreModal } from '@/screens/GameScreen/ScoreModal';
import { useGameModalDismiss } from '@/screens/GameScreen/useGameModalDismiss';

export default function GameScoreRoute() {
  const onClose = useGameModalDismiss();

  return (
    <ModalRouteFrame onRequestClose={onClose}>
      <ScoreModal onClose={onClose} />
    </ModalRouteFrame>
  );
}
