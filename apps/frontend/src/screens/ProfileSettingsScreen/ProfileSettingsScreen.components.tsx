import { Pressable } from 'react-native';

import { Box } from '@/components/ui/box';
import { Pressable as AppPressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { type OAuthProviderId } from '@/services/authProviders';
import {
  badgeBaseClassNames,
  badgeTextToneClassNames,
  badgeToneClassNames,
  labelClassNames,
  panelClassNames,
  surfaceEffectClassNames,
} from '@/theme';

type SettingsActionTone = 'primary' | 'secondary' | 'danger';

type SettingsActionButtonProps = {
  disabled?: boolean;
  onPress: () => void;
  title: string;
  tone?: SettingsActionTone;
};

type SettingsInfoFieldProps = {
  label: string;
  value: string;
};

type SettingsToggleRowProps = {
  description?: string;
  disabled?: boolean;
  onValueChange: (nextValue: boolean) => void;
  title: string;
  value: boolean;
};

type SettingsValueRowProps = {
  description?: string;
  disabled?: boolean;
  onPress: () => void;
  title: string;
  value: string;
};

type AuthMethodCardProps = {
  actionTitle: string;
  description?: string;
  disabled?: boolean;
  icon: string;
  isConnected: boolean;
  onPress: () => void;
  statusLabel: string;
  title: string;
};

const SettingsRowText = ({ description, title }: { description?: string; title: string }) => (
  <Box className="min-w-0 flex-1 gap-1.5">
    <Text className="text-[17px] font-extrabold text-text-primary">{title}</Text>
    {description ? (
      <Text className="text-[13px] leading-5 text-text-tertiary">{description}</Text>
    ) : null}
  </Box>
);

const SETTINGS_ACTION_TONE_CLASS_NAMES: Record<SettingsActionTone, string> = {
  primary: 'border-border-accent bg-text-accent',
  secondary: 'border-border-default bg-surface-card-strong',
  danger: 'border-border-danger bg-feedback-danger',
};

const SETTINGS_ACTION_TEXT_CLASS_NAMES: Record<SettingsActionTone, string> = {
  primary: 'text-text-on-accent',
  secondary: 'text-text-primary',
  danger: 'text-text-primary',
};

const SETTINGS_ACTION_SHADOW_CLASS_NAMES = {
  primary: surfaceEffectClassNames.accent,
  secondary: surfaceEffectClassNames.raised,
  danger: surfaceEffectClassNames.strong,
};

const AUTH_METHOD_BADGE_TONE_CLASS_NAMES = {
  connected: badgeToneClassNames.action,
  disconnected: badgeToneClassNames.neutral,
} as const;

const AUTH_METHOD_ICON_TEXT_CLASS_NAMES = {
  connected: badgeTextToneClassNames.action,
  disconnected: badgeTextToneClassNames.neutral,
} as const;

const AUTH_METHOD_STATUS_TEXT_CLASS_NAMES = {
  connected: badgeTextToneClassNames.action,
  disconnected: badgeTextToneClassNames.tertiary,
} as const;

export const AUTH_METHOD_ICONS: Record<'email' | OAuthProviderId, string> = {
  email: '@',
  apple: 'A',
  google: 'G',
};

export const SettingsActionButton = ({
  disabled = false,
  onPress,
  title,
  tone = 'secondary',
}: SettingsActionButtonProps) => {
  return (
    <Pressable
      className={mergeClassNames(
        'min-h-[54px] w-full items-center justify-center rounded-[20px] border px-5',
        SETTINGS_ACTION_TONE_CLASS_NAMES[tone],
        disabled ? 'opacity-65' : SETTINGS_ACTION_SHADOW_CLASS_NAMES[tone]
      )}
      onPress={onPress}
      disabled={disabled}
    >
      <Text className={`text-[16px] font-extrabold ${SETTINGS_ACTION_TEXT_CLASS_NAMES[tone]}`}>
        {title}
      </Text>
    </Pressable>
  );
};

export const SettingsInfoField = ({ label, value }: SettingsInfoFieldProps) => {
  return (
    <Box className={mergeClassNames(panelClassNames.strong, 'px-4 py-3.5')}>
      <Text className={labelClassNames.eyebrow}>{label}</Text>
      <Text className="mt-2 text-[15px] leading-6 text-text-primary" selectable>
        {value}
      </Text>
    </Box>
  );
};

export const SettingsToggleRow = ({
  description,
  disabled = false,
  onValueChange,
  title,
  value,
}: SettingsToggleRowProps) => {
  return (
    <Box
      className={mergeClassNames(
        panelClassNames.strong,
        'flex-row items-center gap-4 rounded-[24px] p-4 mb-4',
        disabled && 'opacity-70'
      )}
    >
      <SettingsRowText title={title} description={description} />

      <AppPressable
        className={mergeClassNames(
          'h-10 w-[68px] flex-row items-center rounded-full border p-1',
          value
            ? 'justify-end border-border-accent bg-text-accent'
            : 'justify-start border-border-default bg-surface-card',
          !disabled && (value ? surfaceEffectClassNames.accent : surfaceEffectClassNames.card)
        )}
        onPress={() => onValueChange(!value)}
        disabled={disabled}
        accessibilityRole="switch"
        accessibilityLabel={title}
        accessibilityState={{ checked: value, disabled }}
      >
        <Box
          className={mergeClassNames(
            'h-8 w-8 rounded-full border',
            value
              ? 'border-border-accent bg-surface-card'
              : 'border-border-default bg-surface-card-strong'
          )}
        />
      </AppPressable>
    </Box>
  );
};

export const SettingsValueRow = ({
  description,
  disabled = false,
  onPress,
  title,
  value,
}: SettingsValueRowProps) => {
  return (
    <AppPressable
      className={mergeClassNames(
        panelClassNames.strong,
        'mb-4 flex-row items-center gap-4 rounded-[24px] p-4',
        !disabled && surfaceEffectClassNames.raised,
        disabled && 'opacity-70'
      )}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <SettingsRowText title={title} description={description} />

      <Box className="flex-row items-center max-w-[132px] gap-1">
        <Text
          className="text-right text-[13px] font-bold leading-5 text-text-accent"
          numberOfLines={2}
        >
          {value}
        </Text>
        <Text className="text-[24px] leading-6 text-text-accent" accessible={false}>
          ›
        </Text>
      </Box>
    </AppPressable>
  );
};

export const AuthMethodCard = ({
  actionTitle,
  description,
  disabled = false,
  icon,
  isConnected,
  onPress,
  statusLabel,
  title,
}: AuthMethodCardProps) => {
  const authMethodTone = isConnected ? 'connected' : 'disconnected';

  return (
    <Box className={mergeClassNames(panelClassNames.strong, 'gap-4 rounded-[24px] p-4')}>
      <Box className="flex-row items-start gap-3">
        <Box
          className={mergeClassNames(
            badgeBaseClassNames.icon,
            AUTH_METHOD_BADGE_TONE_CLASS_NAMES[authMethodTone]
          )}
        >
          <Text
            className={mergeClassNames(
              'text-[18px] font-extrabold',
              AUTH_METHOD_ICON_TEXT_CLASS_NAMES[authMethodTone]
            )}
          >
            {icon}
          </Text>
        </Box>

        <Box className="min-w-0 flex-1 gap-1.5">
          <Box className="flex-row flex-wrap items-center gap-2">
            <Text className="text-[17px] font-extrabold text-text-primary">{title}</Text>
            <Box
              className={mergeClassNames(
                badgeBaseClassNames.chip,
                AUTH_METHOD_BADGE_TONE_CLASS_NAMES[authMethodTone]
              )}
            >
              <Text
                className={mergeClassNames(
                  labelClassNames.eyebrow,
                  AUTH_METHOD_STATUS_TEXT_CLASS_NAMES[authMethodTone]
                )}
              >
                {statusLabel}
              </Text>
            </Box>
          </Box>
          {description ? (
            <Text className="text-[13px] leading-5 text-text-tertiary">{description}</Text>
          ) : null}
        </Box>
      </Box>

      <SettingsActionButton
        title={actionTitle}
        onPress={onPress}
        disabled={disabled}
        tone={isConnected ? 'secondary' : 'primary'}
      />
    </Box>
  );
};
