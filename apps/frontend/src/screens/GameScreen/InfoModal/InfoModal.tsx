import { ROOM_GAME_EXPIRY_MS } from '@shedding-game/shared';

import { InfoModal as InfoModalBase } from '@/components/InfoModal';
import { useAppTranslation } from '@/i18n';

const gameExpiryHours = Math.floor(ROOM_GAME_EXPIRY_MS / (60 * 60 * 1000));

type InfoModalProps = {
  onClose: () => void;
};

export const InfoModal = function InfoModal({ onClose }: InfoModalProps) {
  const { t } = useAppTranslation('game');
  const hoursLabel = t('hoursLabel', { count: gameExpiryHours });
  const tips = t('infoModal.tips', {
    returnObjects: true,
    hours: gameExpiryHours,
    hoursLabel,
  }) as string[];

  return <InfoModalBase onRequestClose={onClose} title={t('infoModal.title')} tips={tips} />;
};
