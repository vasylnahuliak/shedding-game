import { Stack } from 'expo-router';

import { useAppTranslation } from '@/i18n';
import { appRoutes } from '@/navigation/appRoutes';
import { createStackHeaderOptions } from '@/navigation/createStackHeaderOptions';
import { AdminScreen } from '@/screens/AdminScreen/AdminScreen';

export default function AdminRoute() {
  const { t } = useAppTranslation('admin');

  return (
    <>
      <Stack.Screen
        options={createStackHeaderOptions(t('screen.title'), {
          fallbackHref: appRoutes.profile,
        })}
      />
      <AdminScreen />
    </>
  );
}
