import type { ReactNode } from 'react';

import { ScreenContainer } from '@/components/ScreenContainer';
import { StyledScrollView } from '@/components/ui/interop';

type ProfileScreenShellProps = {
  children: ReactNode;
};

export const ProfileScreenShell = ({ children }: ProfileScreenShellProps) => {
  return (
    <ScreenContainer edges={['bottom']}>
      <StyledScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="gap-lg pb-xxl"
      >
        {children}
      </StyledScrollView>
    </ScreenContainer>
  );
};
