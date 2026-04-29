import { Box } from '@/components/ui/box';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import {
  badgeTextToneClassNames,
  badgeToneClassNames,
  panelClassNames,
  surfaceEffectClassNames,
} from '@/theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ActionButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  icon?: string;
  caption?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: badgeToneClassNames.actionSurface,
  secondary: badgeToneClassNames.surface,
  danger: badgeToneClassNames.dangerSurface,
};

const textClasses: Record<ButtonVariant, string> = {
  primary: badgeTextToneClassNames.onAction,
  secondary: badgeTextToneClassNames.primary,
  danger: badgeTextToneClassNames.danger,
};

const iconClasses: Record<ButtonVariant, string> = {
  primary: badgeToneClassNames.neutral,
  secondary: badgeToneClassNames.strong,
  danger: badgeToneClassNames.danger,
};

export const ActionButton = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  icon,
  caption,
}: ActionButtonProps) => {
  const hasCaption = Boolean(caption);

  return (
    <Pressable
      className={mergeClassNames(
        panelClassNames.strong,
        hasCaption ? 'min-h-[64px] py-3.5' : 'min-h-[56px] py-3',
        'flex-row items-center gap-2.5 px-4 disabled:opacity-100',
        disabled ? badgeToneClassNames.disabledSurface : variantClasses[variant],
        !disabled &&
          (variant === 'primary' ? surfaceEffectClassNames.action : surfaceEffectClassNames.raised)
      )}
      onPress={onPress}
      disabled={disabled}
    >
      {icon ? (
        <Box
          className={mergeClassNames(
            hasCaption ? 'h-10 w-10 rounded-[14px]' : 'h-9 w-9 rounded-[12px]',
            'items-center justify-center',
            disabled ? badgeToneClassNames.neutral : iconClasses[variant]
          )}
        >
          <Text
            className={mergeClassNames(
              hasCaption ? 'text-[20px]' : 'text-[18px]',
              disabled && 'opacity-70'
            )}
          >
            {icon}
          </Text>
        </Box>
      ) : null}
      <Box className="min-w-0 flex-1">
        {caption ? (
          <Text
            className={mergeClassNames(
              'mb-0.5 text-[14px] font-semibold',
              disabled ? badgeTextToneClassNames.muted : badgeTextToneClassNames.neutral
            )}
            numberOfLines={2}
          >
            {caption}
          </Text>
        ) : null}
        <Text
          className={mergeClassNames(
            'text-[18px] font-extrabold',
            disabled ? badgeTextToneClassNames.muted : textClasses[variant]
          )}
          numberOfLines={1}
        >
          {title}
        </Text>
      </Box>
    </Pressable>
  );
};
