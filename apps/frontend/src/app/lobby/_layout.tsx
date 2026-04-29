import { Stack } from 'expo-router';

import {
  fadeTransparentModalScreenOptions,
  TransparentStackLayout,
} from '@/components/TransparentStackLayout/TransparentStackLayout';

export default function LobbyLayout() {
  return (
    <TransparentStackLayout>
      <Stack.Screen name="index" />
      <Stack.Screen name="info" options={fadeTransparentModalScreenOptions} />
      <Stack.Screen name="game-pace" options={fadeTransparentModalScreenOptions} />
      <Stack.Screen name="debug-mode" options={fadeTransparentModalScreenOptions} />
      <Stack.Screen name="rename-room" options={fadeTransparentModalScreenOptions} />
      <Stack.Screen name="rename-bot" options={fadeTransparentModalScreenOptions} />
    </TransparentStackLayout>
  );
}
