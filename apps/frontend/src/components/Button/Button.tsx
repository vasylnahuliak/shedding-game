import { Button as GButton, ButtonText } from '@/components/ui/button';

import type { ButtonProps } from './Button.types';

export const Button = function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
}: ButtonProps) {
  return (
    <GButton disabled={disabled} onPress={onPress} variant={variant}>
      <ButtonText>{title}</ButtonText>
    </GButton>
  );
};
