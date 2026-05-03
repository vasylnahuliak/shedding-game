import { useRouter } from 'expo-router';

import { DEFAULT_SUIT_DISPLAY_MODE } from '@shedding-game/shared';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ProfileScreenShell } from '@/components/ProfileScreenShell/ProfileScreenShell';
import { ProfileSectionCard } from '@/components/ProfileSectionCard';
import { ProfileShortcutCard } from '@/components/ProfileShortcutCard';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { useAppTranslation } from '@/i18n';
import { appRoutes } from '@/navigation/appRoutes';
import { openPrivacyPolicy, openTermsOfUse } from '@/services/legalDocuments';
import { messageBannerClassNames, messageTextToneClassNames, messageToneClassNames } from '@/theme';

import {
  AUTH_METHOD_ICONS,
  AuthMethodCard,
  SettingsActionButton,
  SettingsInfoField,
  SettingsToggleRow,
  SettingsValueRow,
} from './ProfileSettingsScreen.components';
import { useProfileSettingsController } from './useProfileSettingsController';

export const ProfileSettingsScreen = () => {
  const { t } = useAppTranslation(['common', 'auth', 'errors', 'admin']);
  const router = useRouter();
  const {
    accountDeletionError,
    authMethods,
    authMethodsError,
    availableOAuthProviders,
    discardPileError,
    discardPileExpandedByDefault,
    emailAuthMethod,
    getProviderPendingAction,
    handleDiscardPileExpandedByDefaultChange,
    handleHapticsEnabledChange,
    handleProviderToggle,
    hapticsEnabled,
    hapticsError,
    hasPasswordMethod,
    isDeletingAccount,
    isUpdatingDiscardPilePreference,
    isUpdatingHaptics,
    openDeleteAccountConfirmation,
    openPasswordSettings,
    pendingAction,
    user,
  } = useProfileSettingsController();

  const accountFields = [
    { label: t('common:profile.fields.email'), value: user?.email ?? '' },
    { label: t('common:profile.fields.username'), value: user?.name ?? '' },
  ] as const;

  const emailMethodDescription = hasPasswordMethod
    ? t('common:profile.passwordHint')
    : t('common:profile.passwordSetupModalHint');
  const suitDisplayMode = user?.suitDisplayMode ?? DEFAULT_SUIT_DISPLAY_MODE;

  return (
    <ProfileScreenShell>
      <ProfileSectionCard
        title={t('common:profile.sections.account')}
        hint={t('common:profile.editHint')}
      >
        <Box className="gap-3.5">
          {accountFields.map((field) => (
            <SettingsInfoField key={field.label} label={field.label} value={field.value} />
          ))}

          <SettingsActionButton
            title={t('common:profile.actions.editUsername')}
            onPress={() => router.push(appRoutes.profileSettingsEdit)}
            disabled={isDeletingAccount}
          />
        </Box>
      </ProfileSectionCard>

      <ProfileSectionCard
        title={t('common:language.label')}
        hint={t('common:profile.languageHint')}
      >
        <LanguageSwitcher style={{ width: '100%' }} variant="panel" />
      </ProfileSectionCard>

      <ProfileSectionCard
        title={t('common:profile.sections.additional')}
        hint={t('common:profile.additionalHint')}
      >
        {discardPileError ? (
          <Box
            className={mergeClassNames(
              messageBannerClassNames.root,
              'mb-3.5',
              messageToneClassNames.error
            )}
          >
            <Text
              className={mergeClassNames(
                messageBannerClassNames.text,
                messageTextToneClassNames.error
              )}
            >
              {discardPileError}
            </Text>
          </Box>
        ) : null}

        {hapticsError ? (
          <Box
            className={mergeClassNames(
              messageBannerClassNames.root,
              'mb-3.5',
              messageToneClassNames.error
            )}
          >
            <Text
              className={mergeClassNames(
                messageBannerClassNames.text,
                messageTextToneClassNames.error
              )}
            >
              {hapticsError}
            </Text>
          </Box>
        ) : null}

        <SettingsValueRow
          title={t('common:profile.suitDisplay.title')}
          description={t('common:profile.suitDisplay.description')}
          value={t(`common:profile.suitDisplay.modes.${suitDisplayMode}.label`)}
          onPress={() => router.push(appRoutes.profileSettingsSuitDisplayMode)}
          disabled={Boolean(pendingAction)}
        />

        <SettingsToggleRow
          title={t('common:profile.discardPile.title')}
          description={t('common:profile.discardPile.description')}
          value={discardPileExpandedByDefault}
          onValueChange={(nextValue) => {
            void handleDiscardPileExpandedByDefaultChange(nextValue);
          }}
          disabled={isUpdatingDiscardPilePreference || Boolean(pendingAction)}
        />

        <SettingsToggleRow
          title={t('common:profile.haptics.title')}
          description={t('common:profile.haptics.description')}
          value={hapticsEnabled}
          onValueChange={(nextValue) => {
            void handleHapticsEnabledChange(nextValue);
          }}
          disabled={isUpdatingHaptics || Boolean(pendingAction)}
        />
      </ProfileSectionCard>

      <ProfileSectionCard
        title={t('common:profile.sections.signInMethods')}
        hint={t('common:profile.authMethods.hint')}
      >
        {authMethodsError ? (
          <Box
            className={mergeClassNames(
              messageBannerClassNames.root,
              'mb-3.5',
              messageToneClassNames.error
            )}
          >
            <Text
              className={mergeClassNames(
                messageBannerClassNames.text,
                messageTextToneClassNames.error
              )}
            >
              {authMethodsError}
            </Text>
          </Box>
        ) : null}

        <Box className="gap-3.5">
          <AuthMethodCard
            icon={AUTH_METHOD_ICONS.email}
            title={t('common:profile.authMethods.email')}
            description={emailMethodDescription}
            isConnected={emailAuthMethod.linked}
            statusLabel={t(
              emailAuthMethod.linked
                ? 'common:profile.authMethods.status.connected'
                : 'common:profile.authMethods.status.notConnected'
            )}
            actionTitle={t(
              hasPasswordMethod
                ? 'common:profile.actions.changePassword'
                : 'common:profile.actions.setPassword'
            )}
            onPress={openPasswordSettings}
            disabled={Boolean(pendingAction)}
          />

          {availableOAuthProviders.map((provider) => {
            const authMethod = authMethods.find((item) => item.id === provider.id) ?? {
              linked: false,
              canUnlink: false,
            };
            const providerButtonLabel = (() => {
              if (pendingAction === getProviderPendingAction(provider.id, 'link')) {
                return t(provider.profileConnectingLabelKey);
              }

              if (pendingAction === getProviderPendingAction(provider.id, 'unlink')) {
                return t(provider.profileDisconnectingLabelKey);
              }

              return t(
                authMethod.linked
                  ? provider.profileDisconnectLabelKey
                  : provider.profileConnectLabelKey
              );
            })();

            return (
              <AuthMethodCard
                key={provider.id}
                icon={AUTH_METHOD_ICONS[provider.id]}
                title={t(provider.profileLabelKey)}
                description={
                  authMethod.linked && !authMethod.canUnlink
                    ? t('common:profile.authMethods.keepOneMethodHint')
                    : undefined
                }
                isConnected={authMethod.linked}
                statusLabel={t(
                  authMethod.linked
                    ? 'common:profile.authMethods.status.connected'
                    : 'common:profile.authMethods.status.notConnected'
                )}
                actionTitle={providerButtonLabel}
                onPress={() => {
                  void handleProviderToggle(provider.id);
                }}
                disabled={Boolean(pendingAction) || (authMethod.linked && !authMethod.canUnlink)}
              />
            );
          })}
        </Box>
      </ProfileSectionCard>

      <ProfileSectionCard title={t('common:profile.sections.legal')}>
        <Box className="gap-3">
          <ProfileShortcutCard
            icon="📜"
            title={t('common:legal.termsTitle')}
            description={t('common:profile.termsHint')}
            onPress={() => {
              void openTermsOfUse();
            }}
            accessibilityLabel={t('common:legal.termsTitle')}
          />
          <ProfileShortcutCard
            icon="🔒"
            title={t('common:legal.privacyTitle')}
            description={t('common:profile.privacyHint')}
            onPress={() => {
              void openPrivacyPolicy();
            }}
            accessibilityLabel={t('common:legal.privacyTitle')}
          />
        </Box>
      </ProfileSectionCard>

      <ProfileSectionCard title={t('admin:debug.title')}>
        <ProfileShortcutCard
          icon="🛟"
          title={t('common:profile.actions.openDebug')}
          description={t('common:profile.debugHint')}
          onPress={() => router.push(appRoutes.profileSettingsDebug)}
          accessibilityLabel={t('common:profile.actions.openDebug')}
        />
      </ProfileSectionCard>

      <ProfileSectionCard
        title={t('common:profile.sections.dangerZone')}
        hint={t('common:profile.deleteHint')}
        tone="danger"
      >
        {accountDeletionError ? (
          <Box
            className={mergeClassNames(
              messageBannerClassNames.root,
              'mb-3.5',
              messageToneClassNames.error
            )}
          >
            <Text
              className={mergeClassNames(
                messageBannerClassNames.text,
                messageTextToneClassNames.error
              )}
            >
              {accountDeletionError}
            </Text>
          </Box>
        ) : null}

        <SettingsActionButton
          title={
            isDeletingAccount
              ? t('common:profile.actions.deletingAccount')
              : t('common:profile.actions.deleteAccount')
          }
          onPress={openDeleteAccountConfirmation}
          disabled={Boolean(pendingAction)}
          tone="danger"
        />
      </ProfileSectionCard>
    </ProfileScreenShell>
  );
};
