import { Stack } from 'expo-router';

import { useAppTranslation } from '@/i18n';
import { appRoutes } from '@/navigation/appRoutes';
import { createStackHeaderOptions } from '@/navigation/createStackHeaderOptions';
import { FilterButtons } from '@/screens/ProfileStatsScreen/components/FilterButtons';
import { ProfileStatsScreen } from '@/screens/ProfileStatsScreen/ProfileStatsScreen';

export default function ProfileStatsRoute() {
  const { t } = useAppTranslation('common');

  return (
    <>
      <Stack.Screen
        options={createStackHeaderOptions(t('profile.statsTitle'), {
          fallbackHref: appRoutes.profile,
          headerRight: () => <FilterButtons />,
        })}
      />
      <ProfileStatsScreen />
    </>
  );
}
