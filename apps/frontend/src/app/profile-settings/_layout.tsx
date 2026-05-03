import { Stack } from 'expo-router';

import {
  fadeTransparentModalScreenOptions,
  TransparentStackLayout,
} from '@/components/TransparentStackLayout/TransparentStackLayout';

export default function ProfileSettingsLayout() {
  return (
    <TransparentStackLayout>
      <Stack.Screen name="index" />
      <Stack.Screen name="edit-profile" options={fadeTransparentModalScreenOptions} />
      <Stack.Screen name="change-password" options={fadeTransparentModalScreenOptions} />
      <Stack.Screen name="suit-display-mode" options={fadeTransparentModalScreenOptions} />
      <Stack.Screen name="debug" options={fadeTransparentModalScreenOptions} />
    </TransparentStackLayout>
  );
}
