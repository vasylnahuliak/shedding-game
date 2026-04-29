import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as AppleAuthentication from 'expo-apple-authentication';

import { MAX_PLAYER_NAME_LENGTH, parseWithSchema, PlayerNameSchema } from '@shedding-game/shared';

import { useAuth } from '@/hooks/useAuthStore';
import { useAppTranslation } from '@/i18n';
import { analytics } from '@/services/analytics';
import { OAUTH_PROVIDER_CONFIGS } from '@/services/authProviders';

import {
  runCancelPasswordRecovery,
  runCompleteProfile,
  runForceLogout,
  runLogin,
  runProviderSignIn,
  runRequestPasswordReset,
  runResetPassword,
  runSendEmailLink,
} from './authScreen.actions';
import {
  type AuthAction,
  type AuthStep,
  getAuthTitle,
  getPrimaryButtonText,
  getPrimaryDisabled,
  getResetPasswordHint,
  getStepFlags,
  isValidEmail,
  shouldRenderPrimaryButton,
  shouldShowExpandedFooter,
  type TranslateFn,
} from './authScreen.shared';

export type AuthScreenController = ReturnType<typeof useAuthScreenController>;

export const useAuthScreenController = () => {
  const { t } = useAppTranslation(['auth', 'errors', 'common']);
  const translate: TranslateFn = (key, options) => String(t(key as never, options as never));
  const login = useAuth((state) => state.login);
  const signInWithProvider = useAuth((state) => state.signInWithProvider);
  const requestEmailSignInLink = useAuth((state) => state.requestEmailSignInLink);
  const completeProfile = useAuth((state) => state.completeProfile);
  const requestPasswordReset = useAuth((state) => state.requestPasswordReset);
  const resetPassword = useAuth((state) => state.resetPassword);
  const cancelPasswordRecovery = useAuth((state) => state.cancelPasswordRecovery);
  const forceLogout = useAuth((state) => state.forceLogout);
  const needsProfileSetup = useAuth((state) => state.needsProfileSetup);
  const passwordRecoveryPending = useAuth((state) => state.passwordRecoveryPending);
  const insets = useSafeAreaInsets();

  const [localStep, setLocalStep] = useState<AuthStep>('methodChoice');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loadingAction, setLoadingAction] = useState<AuthAction>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [showProfileForceLogout, setShowProfileForceLogout] = useState(false);
  const [appleAuthenticationAvailable, setAppleAuthenticationAvailable] = useState(false);

  useEffect(function loadAppleAuthenticationAvailability() {
    if (Platform.OS !== 'ios') {
      return;
    }

    let isMounted = true;

    void AppleAuthentication.isAvailableAsync()
      .then((isAvailable) => {
        if (isMounted) {
          setAppleAuthenticationAvailable(isAvailable);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAppleAuthenticationAvailable(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const step = passwordRecoveryPending
    ? 'resetPassword'
    : needsProfileSetup
      ? 'profile'
      : localStep;

  const normalizedDisplayName = parseWithSchema(PlayerNameSchema, displayName);
  const normalizedEmail = email.trim();
  const emailValid = isValidEmail(normalizedEmail);
  const passwordValid = password.length >= 8;
  const newPasswordValid = newPassword.length >= 8;
  const newPasswordsMatch = newPassword === confirmNewPassword;
  const displayNameValid = normalizedDisplayName.length > 0;
  const isBusy = loadingAction !== null;

  const clearTransientState = () => {
    setAuthError(null);
    setAuthNotice(null);
    setShowProfileForceLogout(false);
  };

  const transitionStep = (nextStep: AuthStep, reset?: () => void) => {
    clearTransientState();
    reset?.();
    setLocalStep(nextStep);
  };

  const stepFlags = getStepFlags(step);
  const loginDisabled = isBusy || !emailValid || !passwordValid;
  const emailEntryDisabled = isBusy || !emailValid;
  const profileDisabled = isBusy || !displayNameValid;
  const forgotPasswordDisabled = isBusy || !emailValid;
  const resetPasswordDisabled = isBusy || !newPasswordValid || !newPasswordsMatch;

  const title = getAuthTitle(step, translate);
  const resetPasswordHint = getResetPasswordHint(
    { newPassword, confirmNewPassword, newPasswordValid, newPasswordsMatch },
    translate
  );
  const emailSentMessage = t('auth:messages.emailSignInLinkSent', { email: normalizedEmail });
  const primaryButtonText = getPrimaryButtonText({ loadingAction, ...stepFlags }, translate);
  const primaryDisabled = getPrimaryDisabled({
    ...stepFlags,
    profileDisabled,
    forgotPasswordDisabled,
    resetPasswordDisabled,
    emailEntryDisabled,
    loginDisabled,
  });
  const availableOAuthProviders = OAUTH_PROVIDER_CONFIGS.filter(
    (provider) => provider.id !== 'apple' || appleAuthenticationAvailable
  );

  const actionContext = {
    isBusy,
    normalizedEmail,
    normalizedDisplayName,
    emailValid,
    password,
    passwordValid,
    displayNameValid,
    newPassword,
    newPasswordValid,
    newPasswordsMatch,
    setStep: setLocalStep,
    setDisplayName,
    setPassword,
    setNewPassword,
    setConfirmNewPassword,
    setLoadingAction,
    setAuthError,
    setAuthNotice,
    setShowProfileForceLogout,
    signInWithProvider,
    requestEmailSignInLink,
    login,
    completeProfile,
    requestPasswordReset,
    resetPassword,
    cancelPasswordRecovery,
    forceLogout,
    t: translate,
  };

  const handlePrimaryAction = () => {
    if (stepFlags.profileStep) {
      void runCompleteProfile(actionContext);
      return;
    }

    if (stepFlags.forgotPasswordStep) {
      void runRequestPasswordReset(actionContext);
      return;
    }

    if (stepFlags.resetPasswordStep) {
      void runResetPassword(actionContext);
      return;
    }

    if (stepFlags.emailEntryStep) {
      void runSendEmailLink(actionContext, { showNotice: false });
      return;
    }

    if (stepFlags.passwordFallbackStep) {
      void runLogin(actionContext);
    }
  };

  const handleChooseEmailMethod = () => {
    if (isBusy) {
      return;
    }

    analytics.track('auth_method_selected', { method: 'email_magic_link' });
    transitionStep('emailEntry', () => {
      setPassword('');
    });
  };

  const handleChooseAnotherMethod = () => {
    if (isBusy) {
      return;
    }

    transitionStep('methodChoice', () => {
      setPassword('');
    });
  };

  const handleUseAnotherEmail = () => {
    if (isBusy) {
      return;
    }

    transitionStep('emailEntry', () => {
      setEmail('');
      setPassword('');
    });
  };

  const handleOpenPasswordFallback = () => {
    if (isBusy) {
      return;
    }

    analytics.track('password_fallback_opened', { email_prefilled: Boolean(normalizedEmail) });
    transitionStep('passwordFallback', () => {
      setPassword('');
    });
  };

  const handleStartForgotPassword = () => {
    if (isBusy) {
      return;
    }

    transitionStep('forgotPassword', () => {
      setPassword('');
    });
  };

  const handleBackToPasswordSignIn = () => {
    if (isBusy) {
      return;
    }

    transitionStep('passwordFallback', () => {
      setNewPassword('');
      setConfirmNewPassword('');
    });
  };

  return {
    insets,
    step,
    stepFlags,
    displayName,
    email,
    password,
    newPassword,
    confirmNewPassword,
    loadingAction,
    authError,
    authNotice,
    showProfileForceLogout,
    appleAuthenticationAvailable,
    normalizedEmail,
    emailValid,
    passwordValid,
    newPasswordValid,
    newPasswordsMatch,
    displayNameValid,
    isBusy,
    title,
    emailSentMessage,
    resetPasswordHint,
    primaryButtonText,
    primaryDisabled,
    shouldRenderPrimaryButton: shouldRenderPrimaryButton(step),
    showExpandedFooter: shouldShowExpandedFooter(step),
    availableOAuthProviders,
    maxPlayerNameLength: MAX_PLAYER_NAME_LENGTH,
    setDisplayName,
    setEmail,
    setPassword,
    setNewPassword,
    setConfirmNewPassword,
    handlePrimaryAction,
    handleProviderSignIn: (providerId: (typeof availableOAuthProviders)[number]['id']) => {
      void runProviderSignIn(actionContext, providerId);
    },
    handleResendEmailLink: () => {
      void runSendEmailLink(actionContext, { showNotice: true });
    },
    handleChooseEmailMethod,
    handleChooseAnotherMethod,
    handleUseAnotherEmail,
    handleOpenPasswordFallback,
    handleStartForgotPassword,
    handleBackToPasswordSignIn,
    handleCancelPasswordRecovery: () => {
      void runCancelPasswordRecovery(actionContext);
    },
    handleForceLogout: () => {
      void runForceLogout(actionContext);
    },
  };
};
