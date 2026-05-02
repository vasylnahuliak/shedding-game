import { useEffect, useState } from 'react';
import { Pressable } from 'react-native';

import { useRouter } from 'expo-router';

/* jscpd:ignore-start */
import { ProfileScreenShell } from '@/components/ProfileScreenShell/ProfileScreenShell';
import { ProfileSectionCard } from '@/components/ProfileSectionCard';
import { ProfileShortcutCard } from '@/components/ProfileShortcutCard';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { useCanAccessAdmin } from '@/hooks';
import { useAuth } from '@/hooks/useAuthStore';
import { useAppTranslation } from '@/i18n';
import { analytics } from '@/services/analytics';
import {
  badgeBaseClassNames,
  badgeTextToneClassNames,
  badgeToneClassNames,
  labelClassNames,
  messageBannerClassNames,
  messageTextToneClassNames,
  messageToneClassNames,
  panelClassNames,
  surfaceEffectClassNames,
} from '@/theme';
import { getAuthServiceErrorMessage } from '@/utils/authErrors';
/* jscpd:ignore-end */

const getAvatarLetter = (name: string | undefined) => {
  const firstCharacter = name?.trim().charAt(0);
  return firstCharacter ? firstCharacter.toUpperCase() : '?';
};

export const ProfileScreen = () => {
  const { t } = useAppTranslation(['common', 'errors']);
  const router = useRouter();
  const user = useAuth((state) => state.user);
  const logout = useAuth((state) => state.logout);
  const canAccessAdmin = useCanAccessAdmin();

  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<'logout' | null>(null);

  const isLoggingOut = pendingAction === 'logout';

  useEffect(function trackProfileScreenView() {
    analytics.track('profile_opened');
  }, []);

  const openSettings = () => {
    router.push('/profile-settings');
  };

  const openStats = () => {
    router.push('/profile-stats');
  };

  const openAdmin = () => {
    router.push('/admin');
  };

  const handleLogout = async () => {
    setLogoutError(null);
    setPendingAction('logout');

    try {
      await logout();
      router.replace('/');
    } catch (logoutActionError) {
      setLogoutError(getAuthServiceErrorMessage(logoutActionError, t('errors:auth.unknown')));
      setPendingAction(null);
    }
  };

  return (
    <ProfileScreenShell>
      <Box
        className={mergeClassNames(
          panelClassNames.accent,
          'rounded-[30px] px-5 py-5',
          surfaceEffectClassNames.prominent
        )}
      >
        <Box
          className={mergeClassNames(
            'mb-4 self-start',
            badgeBaseClassNames.pillLabel,
            badgeToneClassNames.neutral
          )}
        >
          <Text className={labelClassNames.eyebrow}>{t('common:profile.sections.account')}</Text>
        </Box>
        <Box className="flex-row items-center gap-4">
          <Box
            className={mergeClassNames(
              'h-16 w-16 items-center justify-center rounded-[24px] border',
              badgeToneClassNames.accentSolid
            )}
          >
            <Text
              className={mergeClassNames(
                'text-[28px] font-extrabold',
                badgeTextToneClassNames.onAccent
              )}
            >
              {getAvatarLetter(user?.name)}
            </Text>
          </Box>
          <Box className="min-w-0 flex-1 gap-1.5">
            <Text className="text-[24px] font-extrabold text-text-primary" numberOfLines={1}>
              {user?.name}
            </Text>
            <Text className="text-[14px] leading-5 text-text-tertiary" numberOfLines={1} selectable>
              {user?.email ?? ''}
            </Text>
          </Box>
        </Box>
      </Box>

      {canAccessAdmin ? (
        <ProfileSectionCard
          title={t('common:profile.adminTitle')}
          hint={t('common:profile.adminHint')}
        >
          <ProfileShortcutCard
            icon="🛠️"
            title={t('common:profile.adminTitle')}
            description={t('common:profile.adminItems')}
            onPress={openAdmin}
            accessibilityLabel={t('common:profile.adminTitle')}
          />
        </ProfileSectionCard>
      ) : null}

      <ProfileSectionCard
        title={t('common:profile.statsTitle')}
        hint={t('common:profile.statsHint')}
      >
        <ProfileShortcutCard
          icon="📊"
          title={t('common:profile.statsTitle')}
          description={t('common:profile.statsItems')}
          onPress={openStats}
          accessibilityLabel={t('common:profile.statsTitle')}
        />
      </ProfileSectionCard>

      <ProfileSectionCard
        title={t('common:profile.settingsTitle')}
        hint={t('common:profile.settingsHint')}
      >
        <ProfileShortcutCard
          icon="⚙️"
          title={t('common:profile.settingsTitle')}
          description={t('common:profile.settingsItems')}
          onPress={openSettings}
          accessibilityLabel={t('common:profile.settingsTitle')}
        />
      </ProfileSectionCard>

      <ProfileSectionCard
        title={t('common:profile.sections.session')}
        hint={t('common:profile.logoutHint')}
      >
        {logoutError ? (
          <Box
            className={mergeClassNames(
              messageBannerClassNames.root,
              'mb-[14px]',
              messageToneClassNames.error
            )}
          >
            <Text
              className={mergeClassNames(
                messageBannerClassNames.text,
                messageTextToneClassNames.error
              )}
            >
              {logoutError}
            </Text>
          </Box>
        ) : null}

        <Pressable
          className={mergeClassNames(
            'min-h-[56px] items-center justify-center rounded-[20px] border border-border-danger bg-overlay-danger-soft px-4',
            isLoggingOut ? 'opacity-65' : surfaceEffectClassNames.strong
          )}
          onPress={() => void handleLogout()}
          disabled={isLoggingOut}
        >
          <Text className="text-base font-extrabold text-feedback-danger">
            {isLoggingOut ? t('common:profile.actions.loggingOut') : t('common:buttons.logout')}
          </Text>
        </Pressable>
      </ProfileSectionCard>
    </ProfileScreenShell>
  );
};
