import { Stack } from 'expo-router';

import { useAppTranslation } from '@/i18n';
import { appRoutes } from '@/navigation/appRoutes';
import { createStackHeaderOptions } from '@/navigation/createStackHeaderOptions';
import { AdminGamesScreen } from '@/screens/AdminScreen/AdminGamesScreen';
import { FilterButtons } from '@/screens/AdminScreen/components/FilterButtons';

export default function AdminGamesRoute() {
  const { t } = useAppTranslation('admin');

  return (
    <>
      <Stack.Screen
        options={createStackHeaderOptions(t('gamesScreen.title'), {
          fallbackHref: appRoutes.admin,
          headerRight: () => <FilterButtons />,
        })}
      />
      <AdminGamesScreen />
    </>
  );
}
