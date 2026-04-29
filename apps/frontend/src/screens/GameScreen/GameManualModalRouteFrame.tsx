import type { ReactNode } from 'react';

import { modalContentNarrowClassName } from '@/components/Modal';
import { ModalRouteFrame } from '@/components/ModalRouteFrame';

import { useGameModalDismiss } from './useGameModalDismiss';

type GameManualModalRouteFrameProps = {
  children: (onClose: () => void) => ReactNode;
};

export const GameManualModalRouteFrame = ({ children }: GameManualModalRouteFrameProps) => {
  const onClose = useGameModalDismiss();

  return (
    <ModalRouteFrame onRequestClose={onClose} contentClassName={modalContentNarrowClassName}>
      {children(onClose)}
    </ModalRouteFrame>
  );
};
