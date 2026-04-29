import { Ionicons } from '@expo/vector-icons';

import { LightAuthButton } from '../LightAuthButton/LightAuthButton';

type EmailAuthButtonProps = {
  isBusy: boolean;
  label: string;
  onPress: () => void;
};

export const EmailAuthButton = ({ isBusy, label, onPress }: EmailAuthButtonProps) => (
  <LightAuthButton isBusy={isBusy} label={label} onPress={onPress}>
    <Ionicons name="mail-outline" size={20} color="#556259" />
  </LightAuthButton>
);
