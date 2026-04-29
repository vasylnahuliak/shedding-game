import React, { createContext, use } from 'react';
import { Pressable as RNPressable, type PressableProps, Text as RNText } from 'react-native';

import { surfaceEffectClassNames } from '@/theme';

import { mergeClassNames } from '../utils';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
type ButtonSize = 'default' | 'compact' | 'hero' | 'icon';

type ButtonContextValue = {
  disabled: boolean;
  size: ButtonSize;
  variant: ButtonVariant;
};

const ButtonContext = createContext<ButtonContextValue | null>(null);

type ButtonProps = PressableProps & {
  className?: string;
  ref?: React.Ref<React.ComponentRef<typeof RNPressable>>;
  size?: ButtonSize;
  variant?: ButtonVariant;
};

const buttonToneClassNames: Record<
  ButtonVariant,
  {
    container: string;
    shadow?: string;
    text: string;
  }
> = {
  primary: {
    container: 'border-transparent bg-text-accent',
    shadow: surfaceEffectClassNames.accent,
    text: 'text-text-on-accent',
  },
  secondary: {
    container: 'border-border-strong bg-surface-card-strong',
    shadow: surfaceEffectClassNames.raised,
    text: 'text-text-primary',
  },
  danger: {
    container: 'border-border-danger bg-feedback-danger',
    shadow: surfaceEffectClassNames.strong,
    text: 'text-text-primary',
  },
  success: {
    container: 'border-border-action bg-surface-action',
    shadow: surfaceEffectClassNames.action,
    text: 'text-text-on-action',
  },
  ghost: {
    container: 'border-transparent bg-transparent',
    text: 'text-text-secondary',
  },
};

const sizeClassNames: Record<ButtonSize, string> = {
  default: 'self-center min-h-[52px] min-w-[168px] rounded-[18px] px-6 py-3',
  compact: 'min-h-[44px] rounded-full px-4 py-2.5',
  hero: 'min-h-[58px] rounded-[22px] px-5 py-3',
  icon: 'h-10 w-10 rounded-full',
};

const textSizeClassNames: Record<ButtonSize, string> = {
  default: 'text-[15px] font-extrabold text-center',
  compact: 'text-[14px] font-semibold text-center',
  hero: 'text-[18px] font-extrabold text-center',
  icon: 'text-[16px] font-bold text-center',
};

function Button({
  ref,
  children,
  className,
  disabled = false,
  size = 'default',
  variant = 'primary',
  ...props
}: ButtonProps) {
  const resolvedDisabled = disabled ?? false;

  return (
    <ButtonContext.Provider value={{ disabled: resolvedDisabled, size, variant }}>
      <RNPressable
        ref={ref}
        disabled={resolvedDisabled}
        className={mergeClassNames(
          'flex-row items-center justify-center gap-2 border active:opacity-90',
          sizeClassNames[size],
          buttonToneClassNames[variant].container,
          !resolvedDisabled && buttonToneClassNames[variant].shadow,
          resolvedDisabled && 'opacity-60',
          className
        )}
        {...props}
      >
        {children}
      </RNPressable>
    </ButtonContext.Provider>
  );
}

type ButtonTextProps = React.ComponentPropsWithoutRef<typeof RNText> & {
  className?: string;
  ref?: React.Ref<React.ComponentRef<typeof RNText>>;
};

function ButtonText({ ref, className, ...props }: ButtonTextProps) {
  const context = use(ButtonContext);
  const resolvedDisabled = context?.disabled ?? false;
  const resolvedSize = context?.size ?? 'default';
  const resolvedVariant = context?.variant ?? 'primary';

  return (
    <RNText
      ref={ref}
      className={mergeClassNames(
        textSizeClassNames[resolvedSize],
        buttonToneClassNames[resolvedVariant].text,
        resolvedDisabled && 'opacity-55',
        className
      )}
      {...props}
    />
  );
}

Button.displayName = 'Button';
ButtonText.displayName = 'ButtonText';
export { Button, ButtonText };
