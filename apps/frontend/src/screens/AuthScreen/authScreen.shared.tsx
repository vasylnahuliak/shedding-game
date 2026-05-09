import { Emoji } from '@/components/Emoji';
import { Box } from '@/components/ui/box';
import { Button as UIButton, ButtonText } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import type { OAuthProviderId } from '@/services/authProviders';
import {
  badgeBaseClassNames,
  badgeToneClassNames,
  messageBannerClassNames,
  surfaceEffectClassNames,
} from '@/theme';

export type AuthStep =
  | 'methodChoice'
  | 'emailEntry'
  | 'emailSent'
  | 'passwordFallback'
  | 'profile'
  | 'forgotPassword'
  | 'resetPassword';

type OAuthLoadingAction = `oauth-${OAuthProviderId}`;
export type AuthAction =
  | 'emailLink'
  | 'login'
  | OAuthLoadingAction
  | 'profile'
  | 'forgotPassword'
  | 'resetPassword'
  | 'forceLogout'
  | null;

export type TranslateFn = (key: string, options?: Record<string, string | number>) => string;

export const MIN_PASSWORD_LENGTH = 8;
const BRAND_NAME = 'Shedding Game';
export const AUTH_SCROLL_PADDING_BOTTOM = 28;
export const AUTH_SCROLL_PADDING_HORIZONTAL = 16;
export const AUTH_SCROLL_PADDING_TOP = 8;
export const AUTH_HERO_CARD_CLASS_NAME =
  'overflow-hidden rounded-[32px] border border-border-accent-subtle bg-surface-card px-5 pb-5 pt-6';
export const AUTH_HINT_TEXT_CLASS_NAME = '-mt-2 mb-3.5 text-xs text-text-secondary';

export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const getOAuthLoadingAction = (providerId: OAuthProviderId): OAuthLoadingAction =>
  `oauth-${providerId}`;

export const getStepFlags = (step: AuthStep) => ({
  methodChoiceStep: step === 'methodChoice',
  emailEntryStep: step === 'emailEntry',
  emailSentStep: step === 'emailSent',
  passwordFallbackStep: step === 'passwordFallback',
  profileStep: step === 'profile',
  forgotPasswordStep: step === 'forgotPassword',
  resetPasswordStep: step === 'resetPassword',
});

export const getAuthTitle = (step: AuthStep, t: TranslateFn) => {
  if (step === 'methodChoice') return t('auth:account.titles.methodChoice');
  if (step === 'emailEntry') return t('auth:account.titles.emailEntry');
  if (step === 'emailSent') return t('auth:account.titles.emailSent');
  if (step === 'passwordFallback') return t('auth:account.titles.passwordFallback');
  if (step === 'profile') return t('auth:account.titles.profile');
  if (step === 'forgotPassword') return t('auth:account.titles.forgotPassword');
  return t('auth:account.titles.resetPassword');
};

export const getResetPasswordHint = (
  params: {
    newPassword: string;
    confirmNewPassword: string;
    newPasswordValid: boolean;
    newPasswordsMatch: boolean;
  },
  t: TranslateFn
) => {
  if (!params.newPassword) {
    return t('auth:hints.passwordMin', { count: MIN_PASSWORD_LENGTH });
  }

  if (!params.newPasswordValid) {
    return t('auth:hints.passwordLeft', {
      count: MIN_PASSWORD_LENGTH - params.newPassword.length,
    });
  }

  if (params.confirmNewPassword && !params.newPasswordsMatch) {
    return t('errors:auth.passwordMismatch');
  }

  return t('auth:hints.passwordValid');
};

export const getPrimaryButtonText = (
  params: {
    loadingAction: AuthAction;
    profileStep: boolean;
    forgotPasswordStep: boolean;
    resetPasswordStep: boolean;
    emailEntryStep: boolean;
  },
  t: TranslateFn
) => {
  if (params.loadingAction === 'emailLink') return t('auth:actions.loading.emailLink');
  if (params.loadingAction === 'login') return t('auth:actions.loading.login');
  if (params.loadingAction === 'profile') return t('auth:actions.loading.profile');
  if (params.loadingAction === 'forgotPassword') {
    return t('auth:actions.loading.forgotPassword');
  }
  if (params.loadingAction === 'resetPassword') return t('auth:actions.loading.resetPassword');
  if (params.profileStep) return t('auth:actions.completeProfile');
  if (params.forgotPasswordStep) return t('auth:actions.sendResetLink');
  if (params.resetPasswordStep) return t('auth:actions.updatePassword');
  if (params.emailEntryStep) return t('auth:actions.sendSignInLink');
  return t('auth:actions.login');
};

export const getPrimaryDisabled = (params: {
  profileStep: boolean;
  forgotPasswordStep: boolean;
  resetPasswordStep: boolean;
  emailEntryStep: boolean;
  profileDisabled: boolean;
  forgotPasswordDisabled: boolean;
  resetPasswordDisabled: boolean;
  emailEntryDisabled: boolean;
  loginDisabled: boolean;
}) => {
  if (params.profileStep) return params.profileDisabled;
  if (params.forgotPasswordStep) return params.forgotPasswordDisabled;
  if (params.resetPasswordStep) return params.resetPasswordDisabled;
  if (params.emailEntryStep) return params.emailEntryDisabled;
  return params.loginDisabled;
};

export const shouldRenderPrimaryButton = (step: AuthStep) =>
  step === 'emailEntry' ||
  step === 'passwordFallback' ||
  step === 'profile' ||
  step === 'forgotPassword' ||
  step === 'resetPassword';

export const shouldShowExpandedFooter = (step: AuthStep) =>
  step === 'methodChoice' || step === 'emailEntry';

type AuthPrimaryActionButtonProps = {
  disabled: boolean;
  onPress: () => void;
  title: string;
};

export const AuthPrimaryActionButton = ({
  disabled,
  onPress,
  title,
}: AuthPrimaryActionButtonProps) => {
  const resolvedVariant = disabled ? 'ghost' : 'primary';

  return (
    <UIButton
      className={mergeClassNames(
        'w-full',
        disabled && 'border-border-default bg-surface-button-disabled'
      )}
      disabled={disabled}
      onPress={onPress}
      size="hero"
      variant={resolvedVariant}
    >
      <ButtonText className={disabled ? 'text-text-secondary' : undefined}>{title}</ButtonText>
    </UIButton>
  );
};

type AuthBannerProps = {
  icon?: string;
  message: string;
  tone?: 'danger' | 'success';
};

const AUTH_BANNER_TONE_CLASS_NAMES = {
  danger: 'border-feedback-danger bg-overlay-danger-soft',
  success: 'border-feedback-success bg-overlay-success-soft',
} as const;

const AUTH_BANNER_TEXT_CLASS_NAMES = {
  danger: 'text-feedback-danger',
  success: 'text-feedback-success',
} as const;

export const AuthBanner = ({ icon, message, tone = 'success' }: AuthBannerProps) => (
  <Box
    className={mergeClassNames(messageBannerClassNames.root, AUTH_BANNER_TONE_CLASS_NAMES[tone])}
  >
    {icon ? <Emoji emoji={icon} className={messageBannerClassNames.icon} /> : null}
    <Text
      className={mergeClassNames(messageBannerClassNames.text, AUTH_BANNER_TEXT_CLASS_NAMES[tone])}
    >
      {message}
    </Text>
  </Box>
);

export const AuthBrandBadge = () => (
  <Box className={mergeClassNames(badgeBaseClassNames.pill, badgeToneClassNames.neutral)}>
    <Text className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-secondary">
      {BRAND_NAME}
    </Text>
  </Box>
);

export { badgeBaseClassNames, badgeToneClassNames, surfaceEffectClassNames };
