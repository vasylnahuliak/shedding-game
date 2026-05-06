import { Stack, useLocalSearchParams } from 'expo-router';

import { useAppTranslation } from '@/i18n';
import { appRoutes } from '@/navigation/appRoutes';
import { createStackHeaderOptions } from '@/navigation/createStackHeaderOptions';
import { AdminUserGamesScreen } from '@/screens/AdminScreen/AdminUserGamesScreen';
import { FilterButtons } from '@/screens/AdminScreen/components/FilterButtons';

export default function AdminUserGamesRoute() {
  const { t } = useAppTranslation('admin');
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const resolvedUserId = typeof userId === 'string' ? userId : '';

  return (
    <>
      <Stack.Screen
        options={createStackHeaderOptions(t('userGamesScreen.title'), {
          fallbackHref: appRoutes.adminUsers,
          headerRight: () => <FilterButtons />,
        })}
      />
      <AdminUserGamesScreen userId={resolvedUserId} />
    </>
  );
}
