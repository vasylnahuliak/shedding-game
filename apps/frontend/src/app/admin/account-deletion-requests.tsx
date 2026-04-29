import { Stack } from 'expo-router';

import { useAppTranslation } from '@/i18n';
import { appRoutes } from '@/navigation/appRoutes';
import { createStackHeaderOptions } from '@/navigation/createStackHeaderOptions';
import { AdminAccountDeletionRequestsScreen } from '@/screens/AdminScreen/AdminAccountDeletionRequestsScreen';

export default function AdminAccountDeletionRequestsRoute() {
  const { t } = useAppTranslation('admin');

  return (
    <>
      <Stack.Screen
        options={createStackHeaderOptions(t('requestsScreen.title'), {
          fallbackHref: appRoutes.admin,
        })}
      />
      <AdminAccountDeletionRequestsScreen />
    </>
  );
}
