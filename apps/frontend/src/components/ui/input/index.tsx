import type { ComponentProps, ComponentPropsWithRef } from 'react';
import React, { createContext, use, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { mergeClassNames } from '../utils';

type InputSize = 'default' | 'large';

type InputContextValue = {
  disabled: boolean;
  focused: boolean;
  size: InputSize;
  setFocused: (focused: boolean) => void;
};

const InputContext = createContext<InputContextValue | null>(null);

type InputProps = ComponentPropsWithRef<typeof View> & {
  className?: string;
  disabled?: boolean;
  size?: InputSize;
};

const inputContainerSizeClassNames: Record<InputSize, string> = {
  default: 'min-h-10 rounded-md',
  large: 'min-h-[54px] rounded-[18px]',
};

const inputFieldSizeClassNames: Record<InputSize, string> = {
  default: 'flex-1 px-3 py-1 text-base text-text-primary',
  large: 'flex-1 px-4 py-[14px] text-[16px] text-text-primary',
};

const inputSlotSizeClassNames: Record<InputSize, string> = {
  default: 'px-3 py-2',
  large: 'px-4 py-3',
};

function Input({
  ref,
  children,
  className,
  disabled = false,
  size = 'default',
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <InputContext.Provider value={{ disabled, focused, size, setFocused }}>
      <View
        ref={ref}
        className={mergeClassNames(
          'w-full flex-row items-center gap-2 overflow-hidden border border-border-input bg-surface-input',
          inputContainerSizeClassNames[size],
          focused && 'border-border-focus bg-surface-input-focused',
          disabled && 'opacity-50',
          className
        )}
        {...props}
      >
        {children}
      </View>
    </InputContext.Provider>
  );
}

type InputSlotProps = ComponentProps<typeof Pressable> & {
  className?: string;
  size?: InputSize;
};

function InputSlot({ ref, className, disabled, size, ...props }: InputSlotProps) {
  const context = use(InputContext);
  const resolvedDisabled = disabled ?? context?.disabled ?? false;
  const resolvedSize = size ?? context?.size ?? 'default';

  return (
    <Pressable
      ref={ref}
      disabled={resolvedDisabled}
      className={mergeClassNames(
        'items-center justify-center',
        inputSlotSizeClassNames[resolvedSize],
        resolvedDisabled && 'opacity-50',
        className
      )}
      {...props}
    />
  );
}

type InputFieldProps = ComponentPropsWithRef<typeof TextInput> & {
  className?: string;
  size?: InputSize;
};

function InputField({
  ref,
  className,
  editable,
  onBlur,
  onFocus,
  size,
  ...props
}: InputFieldProps) {
  const context = use(InputContext);
  const resolvedEditable = editable ?? !context?.disabled;
  const resolvedSize = size ?? context?.size ?? 'default';

  return (
    <TextInput
      ref={ref}
      editable={resolvedEditable}
      className={mergeClassNames(
        inputFieldSizeClassNames[resolvedSize],
        !resolvedEditable && 'text-text-muted',
        className
      )}
      onBlur={(event) => {
        context?.setFocused(false);
        onBlur?.(event);
      }}
      onFocus={(event) => {
        context?.setFocused(true);
        onFocus?.(event);
      }}
      {...props}
    />
  );
}

Input.displayName = 'Input';
InputSlot.displayName = 'InputSlot';
InputField.displayName = 'InputField';

export { Input, InputField, InputSlot };
