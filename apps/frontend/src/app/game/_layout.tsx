import { Stack } from 'expo-router';

import {
  blockingTransparentModalScreenOptions,
  fadeTransparentModalScreenOptions,
  TransparentStackLayout,
} from '@/components/TransparentStackLayout/TransparentStackLayout';
import { GameScreenProvider } from '@/screens/GameScreen/GameScreenContext';
import { useGameModalSync } from '@/screens/GameScreen/hooks/useGameModalSync';

const GameModalSync = () => {
  useGameModalSync();

  return null;
};

export default function GameLayout() {
  return (
    <GameScreenProvider>
      <GameModalSync />
      <TransparentStackLayout>
        <Stack.Screen name="index" />
        <Stack.Screen name="info" options={fadeTransparentModalScreenOptions} />
        <Stack.Screen name="rules" options={fadeTransparentModalScreenOptions} />
        <Stack.Screen name="score" options={fadeTransparentModalScreenOptions} />
        <Stack.Screen name="suit-picker" options={blockingTransparentModalScreenOptions} />
        <Stack.Screen name="bridge" options={blockingTransparentModalScreenOptions} />
        <Stack.Screen name="round-over" options={blockingTransparentModalScreenOptions} />
        <Stack.Screen name="game-over" options={blockingTransparentModalScreenOptions} />
      </TransparentStackLayout>
    </GameScreenProvider>
  );
}
