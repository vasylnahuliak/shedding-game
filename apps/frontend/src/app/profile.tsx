import { Stack } from 'expo-router';

import { useAppTranslation } from '@/i18n';
import { appRoutes } from '@/navigation/appRoutes';
import { createStackHeaderOptions } from '@/navigation/createStackHeaderOptions';
import { ProfileScreen } from '@/screens/ProfileScreen/ProfileScreen';

export default function Profile() {
  const { t } = useAppTranslation('common');

  return (
    <>
      <Stack.Screen
        options={createStackHeaderOptions(t('profile.title'), {
          fallbackHref: appRoutes.home,
        })}
      />
      <ProfileScreen />
    </>
  );
}
