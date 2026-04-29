import type { ReactNode } from 'react';

import { Stack } from 'expo-router';

export const fadeTransparentModalScreenOptions = {
  presentation: 'transparentModal' as const,
  animation: 'fade' as const,
};

export const blockingTransparentModalScreenOptions = {
  presentation: 'transparentModal' as const,
  animation: 'slide_from_bottom' as const,
  gestureEnabled: false,
};

type TransparentStackLayoutProps = {
  children: ReactNode;
};

export function TransparentStackLayout({ children }: TransparentStackLayoutProps) {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      {children}
    </Stack>
  );
}
