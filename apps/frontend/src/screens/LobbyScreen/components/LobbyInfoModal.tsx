import { ROOM_WAITING_EXPIRY_MS } from '@shedding-game/shared';

import { InfoModal } from '@/components/InfoModal';
import { useAppTranslation } from '@/i18n';

const waitingExpiryHours = Math.floor(ROOM_WAITING_EXPIRY_MS / (60 * 60 * 1000));

type LobbyInfoModalContentProps = {
  onClose: () => void;
};

export const LobbyInfoModalContent = function LobbyInfoModalContent({
  onClose,
}: LobbyInfoModalContentProps) {
  const { t } = useAppTranslation('lobby');
  const hoursLabel = t('game:hoursLabel', { count: waitingExpiryHours });
  const tips = t('infoModal.tips', {
    returnObjects: true,
    hours: waitingExpiryHours,
    hoursLabel,
  }) as string[];

  return <InfoModal onRequestClose={onClose} title={t('infoModal.title')} tips={tips} />;
};
