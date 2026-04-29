import 'react-native';

declare module 'react-native' {
  export interface ViewStyle {
    boxShadow?: string;
  }

  export interface TextStyle {
    textShadow?: string;
  }

  export interface ImageStyle {
    boxShadow?: string;
  }
}
