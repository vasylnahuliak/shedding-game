import { Stack } from 'expo-router';

import {
  fadeTransparentModalScreenOptions,
  TransparentStackLayout,
} from '@/components/TransparentStackLayout/TransparentStackLayout';

export const FiltersStackLayout = function FiltersStackLayout() {
  return (
    <TransparentStackLayout>
      <Stack.Screen name="index" />
      <Stack.Screen name="filters" options={fadeTransparentModalScreenOptions} />
    </TransparentStackLayout>
  );
};
