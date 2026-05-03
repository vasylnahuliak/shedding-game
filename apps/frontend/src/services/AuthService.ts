import {
  cancelPasswordRecovery,
  completeProfile,
  deleteAccount,
  forceLogout,
  login,
  logout,
  register,
  requestEmailSignInLink,
  requestPasswordReauthentication,
  requestPasswordReset,
  resetPassword,
  updateDiscardPileExpandedByDefault,
  updateEmojiPreference,
  updateHapticsEnabled,
  updateLocale,
  updateProfile,
  updateSuitDisplayMode,
} from './authService.account';
import { AuthServiceError } from './authService.errors';
import {
  consumeAuthRedirect,
  consumePasswordRecoveryLink,
  linkProvider,
  signInWithProvider,
  unlinkProvider,
} from './authService.providers';
import { hydrate, refreshAuthMethods } from './authService.user';

export type { User } from './authService.types';
export { AuthServiceError };

export const AuthService = {
  hydrate,
  login,
  register,
  signInWithProvider,
  linkProvider,
  unlinkProvider,
  refreshAuthMethods,
  completeProfile,
  updateProfile,
  requestEmailSignInLink,
  requestPasswordReset,
  requestPasswordReauthentication,
  consumeAuthRedirect,
  consumePasswordRecoveryLink,
  resetPassword,
  cancelPasswordRecovery,
  logout,
  deleteAccount,
  forceLogout,
  updateEmojiPreference,
  updateHapticsEnabled,
  updateDiscardPileExpandedByDefault,
  updateSuitDisplayMode,
  updateLocale,
};
