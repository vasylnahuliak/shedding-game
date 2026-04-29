import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Box } from '@/components/ui/box';
import { StyledSafeAreaView } from '@/components/ui/interop';

import {
  AUTH_SCROLL_PADDING_BOTTOM,
  AUTH_SCROLL_PADDING_HORIZONTAL,
  AUTH_SCROLL_PADDING_TOP,
} from './authScreen.shared';
import { AuthScreenCard } from './AuthScreenCard';
import { AuthScreenFooter } from './AuthScreenFooter';
import { useAuthScreenController } from './useAuthScreenController';

export const AuthScreen = () => {
  const controller = useAuthScreenController();

  return (
    <StyledSafeAreaView
      className="flex-1 bg-surface-screen"
      edges={['top', 'bottom', 'left', 'right']}
    >
      <Box className="absolute inset-0 bg-surface-screen" />
      <Box className="absolute -right-24 -top-10 h-[260px] w-[260px] rounded-full bg-overlay-action-soft" />
      <Box className="absolute -left-16 bottom-[18%] h-[140px] w-[140px] rounded-full bg-overlay-success-soft" />
      <Box className="absolute right-8 top-[20%] h-[96px] w-[96px] rounded-full bg-overlay-accent-soft" />

      <KeyboardAwareScrollView
        contentContainerStyle={{
          alignItems: 'center',
          flexGrow: 1,
          justifyContent: 'flex-start',
          paddingBottom: AUTH_SCROLL_PADDING_BOTTOM,
          paddingHorizontal: AUTH_SCROLL_PADDING_HORIZONTAL,
          paddingTop: controller.insets.top + AUTH_SCROLL_PADDING_TOP,
          width: '100%',
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Box className="w-full max-w-[420px] gap-4">
          <Box className="flex-row items-center justify-end gap-3 px-0.5">
            <LanguageSwitcher />
          </Box>
          <AuthScreenCard controller={controller} />
          <AuthScreenFooter showExpandedFooter={controller.showExpandedFooter} />
        </Box>
      </KeyboardAwareScrollView>
    </StyledSafeAreaView>
  );
};
