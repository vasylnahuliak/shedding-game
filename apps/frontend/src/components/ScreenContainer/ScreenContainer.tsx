import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { Edge } from 'react-native-safe-area-context';

import { Box } from '@/components/ui/box';
import { StyledSafeAreaView } from '@/components/ui/interop';

interface ScreenContainerProps {
  children: ReactNode;
  edges?: Edge[];
  contentClassName?: string;
  contentStyle?: StyleProp<ViewStyle>;
}

export const ScreenContainer = ({
  children,
  edges = ['top'],
  contentClassName,
  contentStyle,
}: ScreenContainerProps) => {
  return (
    <StyledSafeAreaView className="flex-1 bg-surface-screen" edges={edges}>
      <Box className="flex-1 items-center">
        <Box
          className={`flex-1 w-full max-w-[560px] px-xl pt-lg ${contentClassName ?? ''}`}
          style={contentStyle}
        >
          {children}
        </Box>
      </Box>
    </StyledSafeAreaView>
  );
};
