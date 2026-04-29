import { ModalShell } from '@/components/Modal';
import { Text } from '@/components/ui/text';
import { useAppTranslation } from '@/i18n';

import { useGameScreenContext } from '../GameScreenContext';

export const BridgeModal = function BridgeModal() {
  const { t } = useAppTranslation('game');
  const { bridgeScoreMultiplier, handleBridgeApply, handleBridgeDecline } = useGameScreenContext();

  return (
    <ModalShell
      title={t('bridgeModal.title')}
      subtitle={t('bridgeModal.subtitle')}
      buttons={[
        {
          variant: 'secondary',
          title: t('bridgeModal.decline'),
          onPress: handleBridgeDecline,
        },
        {
          variant: 'success',
          title: t('bridgeModal.apply'),
          onPress: handleBridgeApply,
        },
      ]}
    >
      <Text className="text-sm text-text-muted mb-1 text-center leading-5">
        {t('bridgeModal.description', { scoreMultiplier: bridgeScoreMultiplier })}
      </Text>
    </ModalShell>
  );
};
