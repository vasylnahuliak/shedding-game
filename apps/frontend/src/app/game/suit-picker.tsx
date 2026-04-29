import { ModalRouteFrame } from '@/components/ModalRouteFrame';
import { SuitPickerModal } from '@/screens/GameScreen/SuitPickerModal';

export default function GameSuitPickerRoute() {
  return (
    <ModalRouteFrame dismissible={false} contentPosition="bottom">
      <SuitPickerModal />
    </ModalRouteFrame>
  );
}
