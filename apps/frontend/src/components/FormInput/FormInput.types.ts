import type { TextInputProps } from 'react-native';

export type FormInputProps = Omit<TextInputProps, 'className' | 'style'> & {
  label: string;
  containerClassName?: string;
  inputClassName?: string;
  labelClassName?: string;
  spacing?: 'compact' | 'default';
  enableSecureTextToggle?: boolean;
  showSecureTextLabel?: string;
  hideSecureTextLabel?: string;
};
