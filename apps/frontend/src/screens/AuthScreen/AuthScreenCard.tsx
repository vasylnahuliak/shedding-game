import { Pressable } from 'react-native';

import { Box } from '@/components/ui/box';
import { Button as UIButton, ButtonText } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { useAppTranslation } from '@/i18n';

import {
  AUTH_HERO_CARD_CLASS_NAME,
  AuthBanner,
  AuthBrandBadge,
  AuthPrimaryActionButton,
  badgeBaseClassNames,
  badgeToneClassNames,
  surfaceEffectClassNames,
} from './authScreen.shared';
import { AuthScreenStepContent } from './AuthScreenStepContent';
import type { AuthScreenController } from './useAuthScreenController';

type Props = {
  controller: AuthScreenController;
};

const SecondaryActionButton = ({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled: boolean;
}) => (
  <UIButton
    className="mt-3 w-full border-border-default bg-overlay-scrim"
    disabled={disabled}
    onPress={onPress}
    size="compact"
    variant="ghost"
  >
    <ButtonText>{label}</ButtonText>
  </UIButton>
);

export const AuthScreenCard = ({ controller }: Props) => {
  const { t } = useAppTranslation(['auth']);
  const {
    stepFlags,
    isBusy,
    title,
    authNotice,
    authError,
    showProfileForceLogout,
    loadingAction,
    primaryDisabled,
    primaryButtonText,
    shouldRenderPrimaryButton,
    handlePrimaryAction,
    handleChooseAnotherMethod,
    handleUseAnotherEmail,
    handleResendEmailLink,
    handleOpenPasswordFallback,
    handleBackToPasswordSignIn,
    handleCancelPasswordRecovery,
    handleForceLogout,
  } = controller;

  const topAction = (() => {
    if (stepFlags.emailEntryStep || stepFlags.passwordFallbackStep || stepFlags.emailSentStep) {
      return {
        label: t('auth:actions.chooseAnotherMethod'),
        onPress: handleChooseAnotherMethod,
      };
    }

    if (stepFlags.forgotPasswordStep) {
      return {
        label: t('auth:actions.backToLogin'),
        onPress: handleBackToPasswordSignIn,
      };
    }

    if (stepFlags.resetPasswordStep) {
      return {
        label: t('auth:actions.cancelPasswordRecovery'),
        onPress: handleCancelPasswordRecovery,
      };
    }

    return null;
  })();

  return (
    <Box className="w-full max-w-[420px] gap-4">
      <Box className="flex-row items-center justify-between gap-3 px-0.5">
        <AuthBrandBadge />
      </Box>

      <Box className={mergeClassNames(AUTH_HERO_CARD_CLASS_NAME, surfaceEffectClassNames.modal)}>
        <Box className="absolute -right-10 top-8 h-[148px] w-[148px] rounded-full bg-overlay-action-soft" />
        <Box className="absolute -left-10 bottom-10 h-[108px] w-[108px] rounded-full bg-overlay-accent-soft" />

        {topAction ? (
          <Pressable
            className={mergeClassNames(
              'mb-5 self-start',
              badgeBaseClassNames.pill,
              badgeToneClassNames.neutral
            )}
            disabled={isBusy}
            onPress={topAction.onPress}
          >
            <Text className="text-[13px] font-semibold text-text-secondary">{topAction.label}</Text>
          </Pressable>
        ) : null}

        <Box className="mb-6 items-center">
          <Text
            className={mergeClassNames(
              stepFlags.methodChoiceStep ? 'text-[30px]' : 'text-[28px]',
              'text-center font-extrabold text-text-primary'
            )}
          >
            {title}
          </Text>
        </Box>

        <AuthScreenStepContent controller={controller} />

        {authNotice ? <AuthBanner icon="✓" message={authNotice} /> : null}
        {authError ? <AuthBanner icon="⚠️" message={authError} tone="danger" /> : null}

        {shouldRenderPrimaryButton ? (
          <AuthPrimaryActionButton
            disabled={primaryDisabled}
            onPress={handlePrimaryAction}
            title={primaryButtonText}
          />
        ) : null}

        {stepFlags.profileStep && showProfileForceLogout ? (
          <SecondaryActionButton
            disabled={isBusy}
            label={t('auth:actions.forceLogout')}
            onPress={handleForceLogout}
          />
        ) : null}

        {stepFlags.emailEntryStep ? (
          <SecondaryActionButton
            disabled={isBusy}
            label={t('auth:actions.chooseAnotherMethod')}
            onPress={handleChooseAnotherMethod}
          />
        ) : null}

        {stepFlags.emailSentStep ? (
          <Box className="mt-1">
            <SecondaryActionButton
              disabled={isBusy}
              label={t('auth:actions.useAnotherEmail')}
              onPress={handleUseAnotherEmail}
            />
            <SecondaryActionButton
              disabled={isBusy}
              label={
                loadingAction === 'emailLink'
                  ? t('auth:actions.loading.emailLink')
                  : t('auth:actions.resendSignInLink')
              }
              onPress={handleResendEmailLink}
            />
            <SecondaryActionButton
              disabled={isBusy}
              label={t('auth:actions.usePasswordInstead')}
              onPress={handleOpenPasswordFallback}
            />
          </Box>
        ) : null}

        {stepFlags.passwordFallbackStep ? (
          <SecondaryActionButton
            disabled={isBusy}
            label={t('auth:actions.chooseAnotherMethod')}
            onPress={handleChooseAnotherMethod}
          />
        ) : null}

        {stepFlags.forgotPasswordStep ? (
          <SecondaryActionButton
            disabled={isBusy}
            label={t('auth:actions.backToLogin')}
            onPress={handleBackToPasswordSignIn}
          />
        ) : null}

        {stepFlags.resetPasswordStep ? (
          <SecondaryActionButton
            disabled={isBusy}
            label={t('auth:actions.cancelPasswordRecovery')}
            onPress={handleCancelPasswordRecovery}
          />
        ) : null}
      </Box>
    </Box>
  );
};
