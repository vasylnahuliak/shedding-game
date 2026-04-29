import { Redirect } from 'expo-router';

import { FiltersStackLayout } from '@/components/FiltersStackLayout';
import { useCanAccessAdmin } from '@/hooks';

export default function AdminLayout() {
  const canAccessAdmin = useCanAccessAdmin();

  if (!canAccessAdmin) {
    return <Redirect href="/" />;
  }

  return <FiltersStackLayout />;
}
