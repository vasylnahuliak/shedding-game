import { ModalShell } from '@/components/Modal';
import { ScoreTable } from '@/components/ScoreTable';
import { useGameScreenStore } from '@/hooks';
import { useAppTranslation } from '@/i18n';

type ScoreModalProps = {
  onClose: () => void;
};

export const ScoreModal = function ScoreModal({ onClose }: ScoreModalProps) {
  const { t } = useAppTranslation(['common', 'game']);
  const room = useGameScreenStore((state) => state.room);

  if (!room) {
    return null;
  }

  return (
    <ModalShell
      title={t('game:scoreModal.title')}
      onClose={onClose}
      buttons={[{ title: t('common:buttons.close'), onPress: onClose }]}
    >
      <ScoreTable players={room.players} scoreHistory={room.scoreHistory} maxVisibleRows={7} />
    </ModalShell>
  );
};
