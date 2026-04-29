const auth = {
  account: {
    titles: {
      methodChoice: 'Choose sign-in method',
      emailEntry: 'Sign in with email',
      emailSent: 'Check your email',
      passwordFallback: 'Sign in with password',
      profile: 'Complete your profile',
      register: 'Create account',
      login: 'Sign in to account',
      forgotPassword: 'Reset your password',
      resetPassword: 'Choose a new password',
    },
    badges: {
      methodChoice: 'Quick access',
      emailEntry: 'Magic link',
      emailSent: 'Check inbox',
      passwordFallback: 'Password sign in',
      profile: 'Final step',
      forgotPassword: 'Recovery',
      resetPassword: 'New password',
    },
    subtitles: {
      methodChoice: 'Choose the easiest way to continue the game',
      emailEntry: 'We will send a secure sign-in link to this address.',
      emailSent:
        'If this email can be used to sign in, we sent a link. Open it on this device to continue.',
      passwordFallback: 'Use your email and password if you already added one to this account.',
      profile: 'Set a display name to complete authorization',
      register: 'Sign up with email and password',
      login: 'Sign in to continue the game',
      forgotPassword: 'Enter your email and we will send reset instructions',
      resetPassword: 'Set a fresh password for your account',
    },
    tabs: {
      login: 'Login',
      register: 'Register',
    },
    divider: 'or with email',
  },
  form: {
    labels: {
      displayName: 'Display name',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm password',
      newPassword: 'New password',
      confirmNewPassword: 'Confirm new password',
    },
    actions: {
      showPassword: 'Show password',
      hidePassword: 'Hide password',
    },
    placeholders: {
      displayName: 'Enter your name...',
      password: 'At least 8 characters',
      confirmPassword: 'Repeat password',
      email: 'you@example.com',
      newPassword: 'At least 8 characters',
      confirmNewPassword: 'Repeat new password',
    },
  },
  hints: {
    passwordMin: 'Password: at least {{count}} characters',
    passwordLeft: '{{count}} more character(s) to minimum',
    passwordValid: 'Password is valid',
    passwordNeedAtLeast: 'Password must contain at least {{count}} characters',
    passwordResetPrivacy:
      'If an account exists for this email, password reset instructions will be sent.',
  },
  messages: {
    emailSignInLinkSent:
      'If {{email}} can be used to sign in, we sent a link. Open it on this device to continue.',
    passwordResetEmailSent:
      'If an account exists for this email, we sent password reset instructions.',
  },
  actions: {
    email: 'Continue with Email',
    apple: 'Continue with Apple',
    login: 'Sign in',
    google: 'Continue with Google',
    register: 'Register',
    chooseAnotherMethod: 'Choose another method',
    sendSignInLink: 'Send sign-in link',
    resendSignInLink: 'Resend link',
    useAnotherEmail: 'Use another email',
    usePasswordInstead: 'Use password instead',
    completeProfile: 'Complete profile',
    forgotPassword: 'Forgot password?',
    sendResetLink: 'Send reset link',
    updatePassword: 'Update password',
    backToLogin: 'Back to password sign in',
    cancelPasswordRecovery: 'Cancel and sign in again',
    forceLogout: 'Sign out',
    loading: {
      apple: 'Opening Apple...',
      emailLink: 'Sending link...',
      login: 'Signing in...',
      google: 'Opening Google...',
      register: 'Registering...',
      profile: 'Saving...',
      forgotPassword: 'Sending link...',
      resetPassword: 'Updating password...',
    },
  },
  footer: {
    text: 'Ready to shed your cards?',
    legalNotice: 'By continuing, you agree to the service terms.',
    legalSeparator: 'and',
  },
} as const;

export default auth;
