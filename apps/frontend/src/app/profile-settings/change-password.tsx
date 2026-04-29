import { useState } from 'react';

import { useAlert } from '@/components/AlertProvider';
import { FormInput, PasswordFormInput } from '@/components/FormInput';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/hooks/useAuthStore';
import { useAppTranslation } from '@/i18n';
import {
  getProfileSettingsAuthErrorMessage,
  hasProfileSettingsAuthErrorCode,
  ProfileSettingsInlineMessage,
  ProfileSettingsModalFrame,
  useProfileSettingsModalDismiss,
} from '@/screens/ProfileSettingsScreen/ProfileSettingsModalShared';
import { hasPasswordAuthMethod } from '@/services/authProviders';

export default function ChangePasswordRoute() {
  const { t } = useAppTranslation(['common', 'auth', 'errors']);
  const { showAlert } = useAlert();
  const dismiss = useProfileSettingsModalDismiss();
  const authMethods = useAuth((state) => state.authMethods);
  const requestPasswordReauthentication = useAuth((state) => state.requestPasswordReauthentication);
  const resetPassword = useAuth((state) => state.resetPassword);
  const [newPasswordDraft, setNewPasswordDraft] = useState('');
  const [confirmNewPasswordDraft, setConfirmNewPasswordDraft] = useState('');
  const [passwordResetCode, setPasswordResetCode] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);
  const [isPasswordResetCodeRequired, setPasswordResetCodeRequired] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const hasPasswordMethod = hasPasswordAuthMethod(authMethods);
  const trimmedPasswordResetCode = passwordResetCode.trim();
  const newPasswordValid = newPasswordDraft.length >= 8;
  const newPasswordsMatch = newPasswordDraft === confirmNewPasswordDraft;
  const canUpdatePassword =
    !isUpdatingPassword &&
    newPasswordValid &&
    newPasswordsMatch &&
    (!isPasswordResetCodeRequired || trimmedPasswordResetCode.length > 0);

  const handleClose = () => {
    if (isUpdatingPassword) {
      return;
    }

    dismiss();
  };

  const handlePasswordUpdate = async () => {
    if (!newPasswordValid) {
      setPasswordError(t('errors:auth.minPassword', { count: 8 }));
      return;
    }

    if (!newPasswordsMatch) {
      setPasswordError(t('errors:auth.passwordMismatch'));
      return;
    }

    if (isPasswordResetCodeRequired && !trimmedPasswordResetCode) {
      setPasswordError(t('errors:auth.passwordResetCodeRequired'));
      return;
    }

    setPasswordError(null);
    setPasswordNotice(null);
    setIsUpdatingPassword(true);

    try {
      await resetPassword(newPasswordDraft, trimmedPasswordResetCode || undefined);
      dismiss();
      showAlert(
        t(
          hasPasswordMethod
            ? 'common:profile.actions.passwordUpdatedTitle'
            : 'common:profile.actions.passwordSetTitle'
        ),
        t(
          hasPasswordMethod
            ? 'common:profile.actions.passwordUpdatedMessage'
            : 'common:profile.actions.passwordSetMessage'
        ),
        [{ text: t('common:buttons.ok') }]
      );
    } catch (passwordUpdateError) {
      if (hasProfileSettingsAuthErrorCode(passwordUpdateError, 'reauthentication_needed')) {
        try {
          await requestPasswordReauthentication();
          setPasswordResetCodeRequired(true);
          setPasswordNotice(t('common:profile.passwordCodeSentHint'));
          setPasswordError(null);
        } catch (reauthenticationError) {
          setPasswordError(
            getProfileSettingsAuthErrorMessage(
              reauthenticationError,
              t('errors:auth.passwordResetReauthenticationFailed')
            )
          );
        }
      } else {
        setPasswordError(
          getProfileSettingsAuthErrorMessage(
            passwordUpdateError,
            t('errors:auth.passwordResetFailed')
          )
        );
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <ProfileSettingsModalFrame
      title={t(
        hasPasswordMethod
          ? 'common:profile.actions.changePassword'
          : 'common:profile.actions.setPassword'
      )}
      subtitle={t(
        hasPasswordMethod
          ? 'common:profile.passwordModalHint'
          : 'common:profile.passwordSetupModalHint'
      )}
      dismissible={!isUpdatingPassword}
      onClose={handleClose}
      buttons={[
        {
          variant: 'secondary',
          title: t('common:buttons.cancel'),
          onPress: handleClose,
          disabled: isUpdatingPassword,
        },
        {
          variant: 'success',
          title: isUpdatingPassword
            ? t('common:profile.actions.updatingPassword')
            : t(
                hasPasswordMethod
                  ? 'common:profile.actions.changePassword'
                  : 'common:profile.actions.setPassword'
              ),
          onPress: () => void handlePasswordUpdate(),
          disabled: !canUpdatePassword,
        },
      ]}
    >
      <PasswordFormInput
        label={t('auth:form.labels.newPassword')}
        value={newPasswordDraft}
        onChangeText={setNewPasswordDraft}
        passwordType="new"
        showSecureTextLabel={t('auth:form.actions.showPassword')}
        hideSecureTextLabel={t('auth:form.actions.hidePassword')}
        placeholder={t('auth:form.placeholders.newPassword')}
        returnKeyType="next"
      />

      <PasswordFormInput
        label={t('auth:form.labels.confirmNewPassword')}
        value={confirmNewPasswordDraft}
        onChangeText={setConfirmNewPasswordDraft}
        passwordType="new"
        showSecureTextLabel={t('auth:form.actions.showPassword')}
        hideSecureTextLabel={t('auth:form.actions.hidePassword')}
        placeholder={t('auth:form.placeholders.confirmNewPassword')}
        returnKeyType={isPasswordResetCodeRequired ? 'next' : 'done'}
        onSubmitEditing={
          !isPasswordResetCodeRequired ? () => void handlePasswordUpdate() : undefined
        }
      />

      {isPasswordResetCodeRequired ? (
        <FormInput
          label={t('common:profile.fields.passwordResetCode')}
          value={passwordResetCode}
          onChangeText={setPasswordResetCode}
          autoComplete="one-time-code"
          autoCorrect={false}
          autoCapitalize="none"
          spellCheck={false}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          placeholder={t('common:profile.placeholders.passwordResetCode')}
          returnKeyType="done"
          onSubmitEditing={() => void handlePasswordUpdate()}
        />
      ) : null}

      <Text
        className={`-mt-1.5 mb-3.5 text-xs text-text-secondary ${
          (newPasswordDraft && !newPasswordValid) || (confirmNewPasswordDraft && !newPasswordsMatch)
            ? 'text-feedback-danger'
            : ''
        }`}
      >
        {!newPasswordDraft
          ? t('auth:hints.passwordMin', { count: 8 })
          : !newPasswordValid
            ? t('auth:hints.passwordLeft', { count: 8 - newPasswordDraft.length })
            : confirmNewPasswordDraft && !newPasswordsMatch
              ? t('errors:auth.passwordMismatch')
              : isPasswordResetCodeRequired
                ? t('common:profile.passwordCodeRequiredHint')
                : t('auth:hints.passwordValid')}
      </Text>

      {passwordNotice ? (
        <ProfileSettingsInlineMessage tone="notice" message={passwordNotice} />
      ) : null}

      {passwordError ? <ProfileSettingsInlineMessage tone="error" message={passwordError} /> : null}
    </ProfileSettingsModalFrame>
  );
}
