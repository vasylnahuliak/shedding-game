export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
}
