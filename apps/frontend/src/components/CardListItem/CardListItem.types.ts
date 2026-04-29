import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export interface CardListItemProps {
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}
