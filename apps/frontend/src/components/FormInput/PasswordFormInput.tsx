import { FormInput } from './FormInput';
import type { FormInputProps } from './FormInput.types';

type PasswordType = 'current' | 'new';

type PasswordFormInputProps = Omit<
  FormInputProps,
  | 'secureTextEntry'
  | 'enableSecureTextToggle'
  | 'showSecureTextLabel'
  | 'hideSecureTextLabel'
  | 'autoCapitalize'
  | 'autoCorrect'
  | 'spellCheck'
  | 'autoComplete'
  | 'textContentType'
> & {
  passwordType?: PasswordType;
  showSecureTextLabel: string;
  hideSecureTextLabel: string;
};

const PASSWORD_INPUT_CONFIG = {
  current: {
    autoComplete: 'password',
    textContentType: 'password',
  },
  new: {
    autoComplete: 'new-password',
    textContentType: 'newPassword',
  },
} as const;

export const PasswordFormInput = ({
  passwordType = 'current',
  showSecureTextLabel,
  hideSecureTextLabel,
  ...props
}: PasswordFormInputProps) => {
  const config = PASSWORD_INPUT_CONFIG[passwordType];

  return (
    <FormInput
      {...props}
      secureTextEntry
      enableSecureTextToggle
      showSecureTextLabel={showSecureTextLabel}
      hideSecureTextLabel={hideSecureTextLabel}
      autoComplete={config.autoComplete}
      autoCorrect={false}
      autoCapitalize="none"
      spellCheck={false}
      textContentType={config.textContentType}
    />
  );
};
