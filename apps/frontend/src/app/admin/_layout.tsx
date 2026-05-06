import { Redirect, Stack } from 'expo-router';

import {
  fadeTransparentModalScreenOptions,
  TransparentStackLayout,
} from '@/components/TransparentStackLayout/TransparentStackLayout';
import { useCanAccessAdmin } from '@/hooks';

export default function AdminLayout() {
  const canAccessAdmin = useCanAccessAdmin();

  if (!canAccessAdmin) {
    return <Redirect href="/" />;
  }

  return (
    <TransparentStackLayout>
      <Stack.Screen name="index" />
      <Stack.Screen name="games" />
      <Stack.Screen name="users/index" />
      <Stack.Screen name="users/[userId]/games" />
      <Stack.Screen name="account-deletion-requests" />
      <Stack.Screen name="filters" options={fadeTransparentModalScreenOptions} />
    </TransparentStackLayout>
  );
}
