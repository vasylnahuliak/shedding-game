import { Stack } from 'expo-router';

import { useAppTranslation } from '@/i18n';
import { appRoutes } from '@/navigation/appRoutes';
import { createStackHeaderOptions } from '@/navigation/createStackHeaderOptions';
import { AdminUsersScreen } from '@/screens/AdminScreen/AdminUsersScreen';

export default function AdminUsersRoute() {
  const { t } = useAppTranslation('admin');

  return (
    <>
      <Stack.Screen
        options={createStackHeaderOptions(t('usersScreen.title'), {
          fallbackHref: appRoutes.admin,
        })}
      />
      <AdminUsersScreen />
    </>
  );
}
