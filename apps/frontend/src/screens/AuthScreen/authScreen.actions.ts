import type { Dispatch, SetStateAction } from 'react';

import { analytics } from '@/services/analytics';
import type { OAuthProviderId } from '@/services/authProviders';
import { AuthServiceError } from '@/services/AuthService';
import { getAuthServiceErrorMessage } from '@/utils/authErrors';

import {
  type AuthAction,
  type AuthStep,
  getOAuthLoadingAction,
  MIN_PASSWORD_LENGTH,
  type TranslateFn,
} from './authScreen.shared';

type AuthScreenActionsContext = {
  isBusy: boolean;
  normalizedEmail: string;
  normalizedDisplayName: string;
  emailValid: boolean;
  password: string;
  passwordValid: boolean;
  displayNameValid: boolean;
  newPassword: string;
  newPasswordValid: boolean;
  newPasswordsMatch: boolean;
  setStep: Dispatch<SetStateAction<AuthStep>>;
  setDisplayName: Dispatch<SetStateAction<string>>;
  setPassword: Dispatch<SetStateAction<string>>;
  setNewPassword: Dispatch<SetStateAction<string>>;
  setConfirmNewPassword: Dispatch<SetStateAction<string>>;
  setLoadingAction: Dispatch<SetStateAction<AuthAction>>;
  setAuthError: Dispatch<SetStateAction<string | null>>;
  setAuthNotice: Dispatch<SetStateAction<string | null>>;
  setShowProfileForceLogout: Dispatch<SetStateAction<boolean>>;
  signInWithProvider: (provider: OAuthProviderId) => Promise<void>;
  requestEmailSignInLink: (email: string) => Promise<void>;
  login: (email: string, password: string) => Promise<unknown>;
  completeProfile: (displayName: string) => Promise<unknown>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (password: string) => Promise<unknown>;
  cancelPasswordRecovery: () => Promise<void>;
  forceLogout: () => Promise<void>;
  t: TranslateFn;
};

const clearFeedback = (
  context: Pick<AuthScreenActionsContext, 'setAuthError' | 'setAuthNotice'>
) => {
  context.setAuthError(null);
  context.setAuthNotice(null);
};

export const runProviderSignIn = async (
  context: AuthScreenActionsContext,
  providerId: OAuthProviderId
) => {
  if (context.isBusy) {
    return;
  }

  analytics.track('auth_method_selected', { method: providerId });
  clearFeedback(context);
  context.setLoadingAction(getOAuthLoadingAction(providerId));

  try {
    await context.signInWithProvider(providerId);
  } catch (error) {
    context.setAuthError(getAuthServiceErrorMessage(error, context.t('errors:auth.loginFailed')));
  } finally {
    context.setLoadingAction(null);
  }
};

export const runSendEmailLink = async (
  context: AuthScreenActionsContext,
  options: { showNotice: boolean }
) => {
  if (!context.emailValid) {
    context.setAuthError(context.t('errors:auth.invalidEmail'));
    return;
  }

  clearFeedback(context);
  context.setLoadingAction('emailLink');

  try {
    await context.requestEmailSignInLink(context.normalizedEmail);
    analytics.track('email_link_requested', { method: 'email_magic_link' });
    context.setPassword('');
    context.setStep('emailSent');

    if (options.showNotice) {
      context.setAuthNotice(
        context.t('auth:messages.emailSignInLinkSent', { email: context.normalizedEmail })
      );
    }
  } catch (error) {
    context.setAuthError(
      getAuthServiceErrorMessage(error, context.t('errors:auth.emailLinkRequestFailed'))
    );
  } finally {
    context.setLoadingAction(null);
  }
};

export const runLogin = async (context: AuthScreenActionsContext) => {
  if (!context.emailValid) {
    context.setAuthError(context.t('errors:auth.invalidEmail'));
    return;
  }

  if (!context.passwordValid) {
    context.setAuthError(context.t('errors:auth.minPassword', { count: MIN_PASSWORD_LENGTH }));
    return;
  }

  clearFeedback(context);
  context.setLoadingAction('login');

  try {
    await context.login(context.normalizedEmail, context.password);
  } catch (error) {
    context.setAuthError(getAuthServiceErrorMessage(error, context.t('errors:auth.unknown')));
  } finally {
    context.setLoadingAction(null);
  }
};

export const runCompleteProfile = async (context: AuthScreenActionsContext) => {
  if (!context.displayNameValid) {
    context.setAuthError(context.t('errors:auth.invalidName'));
    return;
  }

  clearFeedback(context);
  context.setShowProfileForceLogout(false);
  context.setLoadingAction('profile');

  try {
    await context.completeProfile(context.normalizedDisplayName);
  } catch (error) {
    context.setShowProfileForceLogout(error instanceof AuthServiceError && error.status === 500);
    context.setAuthError(
      getAuthServiceErrorMessage(error, context.t('errors:auth.completeProfileFailed'))
    );
  } finally {
    context.setLoadingAction(null);
  }
};

export const runForceLogout = async (context: AuthScreenActionsContext) => {
  if (context.isBusy) {
    return;
  }

  context.setLoadingAction('forceLogout');
  context.setAuthNotice(null);

  try {
    await context.forceLogout();
    context.setStep('methodChoice');
    context.setDisplayName('');
    context.setPassword('');
    context.setAuthError(null);
    context.setShowProfileForceLogout(false);
  } catch {
    context.setAuthError(context.t('errors:auth.forceLogoutFailed'));
  } finally {
    context.setLoadingAction(null);
  }
};

export const runRequestPasswordReset = async (context: AuthScreenActionsContext) => {
  if (!context.emailValid) {
    context.setAuthError(context.t('errors:auth.invalidEmail'));
    return;
  }

  clearFeedback(context);
  context.setLoadingAction('forgotPassword');

  try {
    await context.requestPasswordReset(context.normalizedEmail);
    context.setAuthNotice(context.t('auth:messages.passwordResetEmailSent'));
  } catch (error) {
    context.setAuthError(
      getAuthServiceErrorMessage(error, context.t('errors:auth.passwordResetRequestFailed'))
    );
  } finally {
    context.setLoadingAction(null);
  }
};

export const runResetPassword = async (context: AuthScreenActionsContext) => {
  if (!context.newPasswordValid) {
    context.setAuthError(context.t('errors:auth.minPassword', { count: MIN_PASSWORD_LENGTH }));
    return;
  }

  if (!context.newPasswordsMatch) {
    context.setAuthError(context.t('errors:auth.passwordMismatch'));
    return;
  }

  clearFeedback(context);
  context.setLoadingAction('resetPassword');

  try {
    await context.resetPassword(context.newPassword);
    context.setNewPassword('');
    context.setConfirmNewPassword('');
  } catch (error) {
    context.setAuthError(
      getAuthServiceErrorMessage(error, context.t('errors:auth.passwordResetFailed'))
    );
  } finally {
    context.setLoadingAction(null);
  }
};

export const runCancelPasswordRecovery = async (context: AuthScreenActionsContext) => {
  if (context.isBusy) {
    return;
  }

  clearFeedback(context);
  context.setNewPassword('');
  context.setConfirmNewPassword('');

  try {
    await context.cancelPasswordRecovery();
    context.setStep('methodChoice');
  } catch (error) {
    context.setAuthError(
      getAuthServiceErrorMessage(error, context.t('errors:auth.passwordResetCancelFailed'))
    );
  }
};
