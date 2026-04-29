import { Pressable, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';

import { AlertViewport } from '@/components/AlertProvider';
import {
  modalContentClassName,
  modalOverlayBottomClassName,
  modalOverlayClassName,
} from '@/components/Modal';
import type { ModalProps } from '@/components/Modal/Modal.types';
import { mergeClassNames } from '@/components/ui/utils';

type ModalRouteFrameProps = Omit<ModalProps, 'visible' | 'animationType' | 'children'> & {
  children: React.ReactNode;
  dismissible?: boolean;
  fallbackHref?: Href;
  keyboardAvoiding?: boolean;
};

export const ModalRouteFrame = function ModalRouteFrame({
  children,
  onRequestClose,
  contentPosition = 'center',
  overlayClassName,
  overlayStyle,
  contentClassName,
  contentStyle,
  dismissible = true,
  fallbackHref,
  keyboardAvoiding = false,
}: ModalRouteFrameProps) {
  const router = useRouter();

  const handleDismiss = () => {
    if (!dismissible) {
      return;
    }

    if (onRequestClose) {
      onRequestClose();
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    if (fallbackHref) {
      router.replace(fallbackHref);
    }
  };

  const Wrapper = keyboardAvoiding ? KeyboardAvoidingView : View;

  return (
    <Wrapper style={containerStyle} behavior="padding">
      <View
        className={mergeClassNames(
          modalOverlayClassName,
          contentPosition === 'bottom' && modalOverlayBottomClassName,
          overlayClassName
        )}
        style={[overlayStyle]}
      >
        <Pressable className="absolute inset-0" onPress={dismissible ? handleDismiss : undefined} />
        <View
          className={mergeClassNames('box-shadow-modal', modalContentClassName, contentClassName)}
          style={contentStyle}
        >
          {children}
        </View>
      </View>
      <AlertViewport />
    </Wrapper>
  );
};

const containerStyle = {
  flex: 1,
  backgroundColor: 'transparent',
} as const;
