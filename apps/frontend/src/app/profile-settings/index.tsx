import { Stack } from 'expo-router';

import { useAppTranslation } from '@/i18n';
import { appRoutes } from '@/navigation/appRoutes';
import { createStackHeaderOptions } from '@/navigation/createStackHeaderOptions';
import { ProfileSettingsScreen } from '@/screens/ProfileSettingsScreen/ProfileSettingsScreen';

export default function ProfileSettingsRoute() {
  const { t } = useAppTranslation('common');

  return (
    <>
      <Stack.Screen
        options={createStackHeaderOptions(t('profile.settingsTitle'), {
          fallbackHref: appRoutes.profile,
        })}
      />
      <ProfileSettingsScreen />
    </>
  );
}
