import { BACKEND_MESSAGE_TEMPLATES } from '@shedding-game/shared';

const errors = {
  auth: {
    unknown: 'Authorization error. Please try again.',
    registerUnknown: 'Registration error. Please try again.',
    completeProfileFailed: 'Failed to complete profile',
    invalidEmail: 'Please enter a valid email',
    invalidLoginCredentials: 'Invalid email or password',
    invalidName: 'Please enter a player name',
    usernameTaken: 'This username is already taken',
    passwordMismatch: 'Passwords do not match',
    minPassword: 'Password must contain at least {{count}} characters',
    sessionCreateFailed: 'Failed to create sign-in session',
    profileRequired: 'Player profile setup is required',
    loginFailed: 'Sign-in failed',
    registrationNeedsEmailConfirm: 'Registration created. Confirm your email and sign in again.',
    saveProfileFailed: 'Failed to save profile',
    completeProfileServiceFailed: 'Failed to complete profile',
    updateProfileFailed: 'Failed to update profile',
    deleteAccountFailed: 'Failed to delete account',
    emailLinkRequestFailed: 'Failed to send the sign-in link',
    passwordResetRequestFailed: 'Failed to send password reset instructions',
    passwordResetLinkInvalid: 'This password reset link is invalid or expired',
    passwordResetFailed: 'Failed to update password',
    passwordResetSameAsOld: 'Choose a new password that is different from the current one',
    passwordResetReauthenticationNeeded:
      'Password change needs additional verification for this session',
    passwordResetReauthenticationFailed: 'Failed to send password verification code',
    passwordResetCodeRequired: 'Enter the verification code from your email',
    passwordResetCodeInvalid: 'The verification code is invalid or expired',
    passwordResetCancelFailed: 'Failed to leave password reset mode',
    providerLinkFailed: 'Failed to connect sign-in method',
    providerUnlinkFailed: 'Failed to disconnect sign-in method',
    providerAlreadyLinked: 'This sign-in method is already connected to your account',
    providerLinkingUnavailable: 'Managing sign-in methods is currently unavailable',
    authMethodNotFound: 'This sign-in method is no longer available on your account',
    lastAuthMethodCannotBeRemoved: 'Keep at least one sign-in method connected to this account',
    forceLogoutFailed: 'Failed to sign out',
  },
  backend: BACKEND_MESSAGE_TEMPLATES.en,
} as const;

export default errors;
