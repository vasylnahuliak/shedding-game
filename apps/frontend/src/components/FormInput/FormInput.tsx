import { useState } from 'react';

import { Emoji } from '@/components/Emoji';
import { FormControl, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control';
import { Input, InputField, InputSlot } from '@/components/ui/input';
import { mergeClassNames } from '@/components/ui/utils';
import { labelClassNames, surfaceEffectClassNames } from '@/theme';

import type { FormInputProps } from './FormInput.types';

const FORM_INPUT_SPACING_CLASS_NAMES = {
  compact: 'mb-lg',
  default: 'mb-xl',
} as const;

export const FormInput = ({
  label,
  containerClassName,
  inputClassName,
  labelClassName,
  onFocus,
  onBlur,
  secureTextEntry,
  enableSecureTextToggle = false,
  showSecureTextLabel,
  hideSecureTextLabel,
  placeholderTextColorClassName,
  spacing = 'default',
  ...textInputProps
}: FormInputProps) => {
  const [isSecureTextVisible, setIsSecureTextVisible] = useState(false);

  const canToggleSecureText = Boolean(secureTextEntry && enableSecureTextToggle);
  const resolvedSecureTextEntry = canToggleSecureText ? !isSecureTextVisible : secureTextEntry;
  const secureTextAccessibilityLabel = isSecureTextVisible
    ? (hideSecureTextLabel ?? 'Hide password')
    : (showSecureTextLabel ?? 'Show password');

  return (
    <FormControl
      className={mergeClassNames(FORM_INPUT_SPACING_CLASS_NAMES[spacing], containerClassName)}
    >
      <FormControlLabel className="mb-2">
        <FormControlLabelText className={mergeClassNames(labelClassNames.field, labelClassName)}>
          {label}
        </FormControlLabelText>
      </FormControlLabel>
      <Input size="large" className={surfaceEffectClassNames.card}>
        <InputField
          {...textInputProps}
          secureTextEntry={resolvedSecureTextEntry}
          onFocus={onFocus}
          onBlur={onBlur}
          className={mergeClassNames(canToggleSecureText && 'pr-2', inputClassName)}
          placeholderTextColorClassName={placeholderTextColorClassName ?? 'accent-text-placeholder'}
        />
        {canToggleSecureText ? (
          <InputSlot
            onPress={() => setIsSecureTextVisible((c) => !c)}
            accessibilityRole="button"
            accessibilityLabel={secureTextAccessibilityLabel}
          >
            <Emoji emoji={isSecureTextVisible ? '🙈' : '👁️'} className="text-xl" size={20} />
          </InputSlot>
        ) : null}
      </Input>
    </FormControl>
  );
};
