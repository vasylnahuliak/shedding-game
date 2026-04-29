import { Pressable } from 'react-native';

import { FormInput, PasswordFormInput } from '@/components/FormInput';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { useAppTranslation } from '@/i18n';

import { AUTH_HINT_TEXT_CLASS_NAME, AuthBanner, MIN_PASSWORD_LENGTH } from './authScreen.shared';
import { AppleAuthButton } from './components/AppleAuthButton/AppleAuthButton';
import { EmailAuthButton } from './components/EmailAuthButton/EmailAuthButton';
import { GoogleAuthButton } from './components/GoogleAuthButton/GoogleAuthButton';
import { LightAuthButton } from './components/LightAuthButton/LightAuthButton';
import type { AuthScreenController } from './useAuthScreenController';

type Props = {
  controller: AuthScreenController;
};

export const AuthScreenStepContent = ({ controller }: Props) => {
  const { t } = useAppTranslation(['auth', 'errors']);
  const {
    stepFlags,
    displayName,
    email,
    password,
    newPassword,
    confirmNewPassword,
    isBusy,
    loadingAction,
    availableOAuthProviders,
    emailSentMessage,
    resetPasswordHint,
    passwordValid,
    newPasswordValid,
    newPasswordsMatch,
    maxPlayerNameLength,
    setDisplayName,
    setEmail,
    setPassword,
    setNewPassword,
    setConfirmNewPassword,
    handleProviderSignIn,
    handleChooseEmailMethod,
    handlePrimaryAction,
    handleStartForgotPassword,
  } = controller;

  return (
    <>
      {stepFlags.methodChoiceStep ? (
        <Box className="gap-3.5">
          {availableOAuthProviders.map((provider) => {
            const providerButtonText =
              loadingAction === `oauth-${provider.id}`
                ? t(provider.authLoadingLabelKey)
                : t(provider.authActionLabelKey);

            if (provider.id === 'apple') {
              return (
                <AppleAuthButton
                  key={provider.id}
                  isBusy={isBusy}
                  label={providerButtonText}
                  onPress={() => {
                    if (isBusy) {
                      return;
                    }

                    handleProviderSignIn(provider.id);
                  }}
                />
              );
            }

            if (provider.id === 'google') {
              return (
                <GoogleAuthButton
                  key={provider.id}
                  isBusy={isBusy}
                  label={providerButtonText}
                  onPress={() => {
                    handleProviderSignIn(provider.id);
                  }}
                />
              );
            }

            return (
              <LightAuthButton
                key={provider.id}
                isBusy={isBusy}
                label={providerButtonText}
                onPress={() => {
                  handleProviderSignIn(provider.id);
                }}
              />
            );
          })}

          <EmailAuthButton
            isBusy={isBusy}
            label={t('auth:actions.email')}
            onPress={handleChooseEmailMethod}
          />
        </Box>
      ) : null}

      {stepFlags.profileStep ? (
        <FormInput
          label={t('auth:form.labels.displayName')}
          spacing="compact"
          value={displayName}
          onChangeText={setDisplayName}
          maxLength={maxPlayerNameLength}
          autoComplete="off"
          autoCorrect={false}
          autoCapitalize="none"
          spellCheck={false}
          placeholder={t('auth:form.placeholders.displayName')}
          onSubmitEditing={handlePrimaryAction}
          returnKeyType="done"
        />
      ) : null}

      {stepFlags.emailEntryStep ||
      stepFlags.passwordFallbackStep ||
      stepFlags.forgotPasswordStep ? (
        <FormInput
          label={t('auth:form.labels.email')}
          spacing="compact"
          value={email}
          onChangeText={setEmail}
          autoComplete="email"
          autoCorrect={false}
          autoCapitalize="none"
          spellCheck={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          placeholder={t('auth:form.placeholders.email')}
          returnKeyType={stepFlags.forgotPasswordStep || stepFlags.emailEntryStep ? 'done' : 'next'}
          onSubmitEditing={
            stepFlags.forgotPasswordStep || stepFlags.emailEntryStep
              ? handlePrimaryAction
              : undefined
          }
        />
      ) : null}

      {stepFlags.passwordFallbackStep ? (
        <>
          <PasswordFormInput
            label={t('auth:form.labels.password')}
            spacing="compact"
            value={password}
            onChangeText={setPassword}
            passwordType="current"
            showSecureTextLabel={t('auth:form.actions.showPassword')}
            hideSecureTextLabel={t('auth:form.actions.hidePassword')}
            placeholder={t('auth:form.placeholders.password')}
            onSubmitEditing={handlePrimaryAction}
            returnKeyType="done"
          />

          <Pressable
            className="self-end -mt-1 mb-3.5 rounded-full px-2 py-1"
            disabled={isBusy}
            onPress={handleStartForgotPassword}
          >
            <Text
              className={mergeClassNames(
                'text-[13px] font-semibold text-text-accent',
                isBusy && 'opacity-45'
              )}
            >
              {t('auth:actions.forgotPassword')}
            </Text>
          </Pressable>

          <Text className={AUTH_HINT_TEXT_CLASS_NAME}>
            {passwordValid || !password
              ? t('auth:hints.passwordNeedAtLeast', { count: MIN_PASSWORD_LENGTH })
              : t('auth:hints.passwordLeft', { count: MIN_PASSWORD_LENGTH - password.length })}
          </Text>
        </>
      ) : null}

      {stepFlags.emailSentStep ? <AuthBanner icon="✓" message={emailSentMessage} /> : null}

      {stepFlags.forgotPasswordStep ? (
        <Text className="-mt-2 mb-3.5 text-xs leading-5 text-text-secondary">
          {t('auth:hints.passwordResetPrivacy')}
        </Text>
      ) : null}

      {stepFlags.resetPasswordStep ? (
        <>
          <PasswordFormInput
            label={t('auth:form.labels.newPassword')}
            spacing="compact"
            value={newPassword}
            onChangeText={setNewPassword}
            passwordType="new"
            showSecureTextLabel={t('auth:form.actions.showPassword')}
            hideSecureTextLabel={t('auth:form.actions.hidePassword')}
            placeholder={t('auth:form.placeholders.newPassword')}
            returnKeyType="next"
          />

          <PasswordFormInput
            label={t('auth:form.labels.confirmNewPassword')}
            spacing="compact"
            value={confirmNewPassword}
            onChangeText={setConfirmNewPassword}
            passwordType="new"
            showSecureTextLabel={t('auth:form.actions.showPassword')}
            hideSecureTextLabel={t('auth:form.actions.hidePassword')}
            placeholder={t('auth:form.placeholders.confirmNewPassword')}
            onSubmitEditing={handlePrimaryAction}
            returnKeyType="done"
          />

          <Text
            className={mergeClassNames(
              '-mt-2 mb-3.5 text-xs',
              (newPassword && !newPasswordValid) || (confirmNewPassword && !newPasswordsMatch)
                ? 'text-feedback-danger'
                : 'text-text-secondary'
            )}
          >
            {resetPasswordHint}
          </Text>
        </>
      ) : null}
    </>
  );
};
