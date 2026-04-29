import type { StyleProp, ViewStyle } from 'react-native';

export interface ModalProps {
  visible: boolean;
  onRequestClose?: () => void;
  animationType?: 'fade' | 'slide' | 'none';
  /** 'center' | 'bottom' — content alignment in overlay */
  contentPosition?: 'center' | 'bottom';
  overlayClassName?: string;
  overlayStyle?: StyleProp<ViewStyle>;
  contentClassName?: string;
  contentStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}
