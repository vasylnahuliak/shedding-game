import type { ReactNode } from 'react';

import type { ButtonProps } from '@/components/Button';
import { modalContentNarrowClassName, ModalShell } from '@/components/Modal';
import { ModalRouteFrame } from '@/components/ModalRouteFrame';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { appRoutes } from '@/navigation/appRoutes';
import { useModalDismiss } from '@/navigation/useModalDismiss';
import { AuthServiceError } from '@/services/AuthService';
import { messageBannerClassNames, messageTextToneClassNames, messageToneClassNames } from '@/theme';

type ProfileSettingsModalFrameProps = {
  title: string;
  subtitle: string;
  dismissible: boolean;
  onClose?: () => void;
  buttons?: ButtonProps[];
  children: ReactNode;
};

export const getProfileSettingsAuthErrorMessage = (error: unknown, fallback: string) =>
  error instanceof AuthServiceError ? error.message : fallback;

export const hasProfileSettingsAuthErrorCode = (error: unknown, expectedCode: string) =>
  error instanceof AuthServiceError && error.code === expectedCode;

export const useProfileSettingsModalDismiss = () => useModalDismiss(appRoutes.profileSettings);

export const createProfileSettingsSaveButtons = ({
  canSave,
  cancelTitle,
  isSaving,
  onCancel,
  onSave,
  saveTitle,
}: {
  canSave: boolean;
  cancelTitle: string;
  isSaving: boolean;
  onCancel: () => void;
  onSave: () => void;
  saveTitle: string;
}): ButtonProps[] => [
  {
    variant: 'secondary',
    title: cancelTitle,
    onPress: onCancel,
    disabled: isSaving,
  },
  {
    variant: 'success',
    title: saveTitle,
    onPress: onSave,
    disabled: !canSave,
  },
];

export const ProfileSettingsModalFrame = ({
  title,
  subtitle,
  dismissible,
  onClose,
  buttons,
  children,
}: ProfileSettingsModalFrameProps) => {
  const dismiss = useModalDismiss(appRoutes.profileSettings);
  const handleClose = onClose ?? dismiss;

  return (
    <ModalRouteFrame
      onRequestClose={handleClose}
      dismissible={dismissible}
      contentClassName={modalContentNarrowClassName}
      keyboardAvoiding
    >
      <ModalShell
        title={title}
        subtitle={subtitle}
        onClose={dismissible ? handleClose : undefined}
        buttons={buttons}
      >
        {children}
      </ModalShell>
    </ModalRouteFrame>
  );
};

export const ProfileSettingsInlineMessage = ({
  tone,
  message,
}: {
  tone: 'error' | 'notice';
  message: string;
}) => (
  <Box className={mergeClassNames(messageBannerClassNames.root, messageToneClassNames[tone])}>
    <Text
      className={mergeClassNames(messageBannerClassNames.text, messageTextToneClassNames[tone])}
    >
      {message}
    </Text>
  </Box>
);
