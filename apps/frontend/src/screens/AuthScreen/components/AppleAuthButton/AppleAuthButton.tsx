import { Ionicons } from '@expo/vector-icons';

import { LightAuthButton } from '../LightAuthButton/LightAuthButton';

type AppleAuthButtonProps = {
  isBusy: boolean;
  label: string;
  onPress: () => void;
};

export const AppleAuthButton = ({ isBusy, label, onPress }: AppleAuthButtonProps) => (
  <LightAuthButton isBusy={isBusy} label={label} onPress={onPress} iconSlotClassName="pl-0.5">
    <Ionicons name="logo-apple" size={20} color="#111111" />
  </LightAuthButton>
);
