import { BulletList } from '@/components/BulletList';
import { modalScrollAreaClassName, ModalShell } from '@/components/Modal';
import { StyledScrollView } from '@/components/ui/interop';
import { useAppTranslation } from '@/i18n';

import type { InfoModalProps } from './InfoModal.types';

export const InfoModal = function InfoModal({
  onRequestClose,
  title,
  tips,
  buttonText,
}: InfoModalProps) {
  const { t } = useAppTranslation('common');
  const resolvedButtonText = buttonText ?? t('buttons.understood');

  return (
    <ModalShell
      title={title}
      onClose={onRequestClose}
      buttons={[{ title: resolvedButtonText, onPress: onRequestClose }]}
    >
      <StyledScrollView
        className={modalScrollAreaClassName}
        contentContainerClassName="pb-md"
        showsVerticalScrollIndicator={false}
      >
        <BulletList items={tips} />
      </StyledScrollView>
    </ModalShell>
  );
};
