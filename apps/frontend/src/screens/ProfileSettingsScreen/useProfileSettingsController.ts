import { useState } from 'react';
import { Platform } from 'react-native';

import { useRouter } from 'expo-router';

import { useAlert } from '@/components/AlertProvider';
import { useAuth } from '@/hooks/useAuthStore';
import { useAppTranslation } from '@/i18n';
import { appRoutes } from '@/navigation/appRoutes';
import {
  hasPasswordAuthMethod,
  OAUTH_PROVIDER_CONFIGS,
  type OAuthProviderId,
} from '@/services/authProviders';
import { getAuthServiceErrorMessage } from '@/utils/authErrors';

type PendingProfileAction =
  | 'delete'
  | `link:${OAuthProviderId}`
  | `unlink:${OAuthProviderId}`
  | null;

const getProviderPendingAction = (providerId: OAuthProviderId, action: 'link' | 'unlink') =>
  `${action}:${providerId}` as const;

export const useProfileSettingsController = () => {
  const { t } = useAppTranslation(['common', 'errors']);
  const router = useRouter();
  const { showAlert } = useAlert();
  const user = useAuth((state) => state.user);
  const authMethods = useAuth((state) => state.authMethods);
  const linkProvider = useAuth((state) => state.linkProvider);
  const unlinkProvider = useAuth((state) => state.unlinkProvider);
  const deleteAccount = useAuth((state) => state.deleteAccount);
  const updateHapticsEnabled = useAuth((state) => state.updateHapticsEnabled);
  const updateDiscardPileExpandedByDefault = useAuth(
    (state) => state.updateDiscardPileExpandedByDefault
  );

  const [authMethodsError, setAuthMethodsError] = useState<string | null>(null);
  const [accountDeletionError, setAccountDeletionError] = useState<string | null>(null);
  const [hapticsError, setHapticsError] = useState<string | null>(null);
  const [discardPileError, setDiscardPileError] = useState<string | null>(null);
  const [isUpdatingHaptics, setIsUpdatingHaptics] = useState(false);
  const [isUpdatingDiscardPilePreference, setIsUpdatingDiscardPilePreference] = useState(false);
  const [pendingHapticsEnabled, setPendingHapticsEnabled] = useState<boolean | null>(null);
  const [pendingDiscardPileExpandedByDefault, setPendingDiscardPileExpandedByDefault] = useState<
    boolean | null
  >(null);
  const [pendingAction, setPendingAction] = useState<PendingProfileAction>(null);

  const isDeletingAccount = pendingAction === 'delete';
  const hasPasswordMethod = hasPasswordAuthMethod(authMethods);
  const emailAuthMethod = authMethods.find((authMethod) => authMethod.id === 'email') ?? {
    id: 'email',
    linked: false,
    canUnlink: false,
  };
  const availableOAuthProviders = OAUTH_PROVIDER_CONFIGS.filter((provider) => {
    if (provider.id !== 'apple') {
      return true;
    }

    const authMethod = authMethods.find((item) => item.id === provider.id);
    return Platform.OS === 'ios' || Boolean(authMethod?.linked);
  });

  const openPasswordSettings = () => {
    if (pendingAction) {
      return;
    }

    router.push(appRoutes.profileSettingsPassword);
  };

  const hapticsEnabled = pendingHapticsEnabled ?? user?.hapticsEnabled ?? false;
  const discardPileExpandedByDefault =
    pendingDiscardPileExpandedByDefault ?? user?.discardPileExpandedByDefault ?? false;

  const handleDiscardPileExpandedByDefaultChange = async (enabled: boolean) => {
    if (isUpdatingDiscardPilePreference || !user) {
      return;
    }

    setDiscardPileError(null);
    setPendingDiscardPileExpandedByDefault(enabled);
    setIsUpdatingDiscardPilePreference(true);

    try {
      await updateDiscardPileExpandedByDefault(enabled);
      setPendingDiscardPileExpandedByDefault(null);
    } catch (error) {
      setPendingDiscardPileExpandedByDefault(null);
      setDiscardPileError(
        getAuthServiceErrorMessage(error, t('common:profile.discardPile.saveFailed'))
      );
    } finally {
      setIsUpdatingDiscardPilePreference(false);
    }
  };

  const handleHapticsEnabledChange = async (enabled: boolean) => {
    if (isUpdatingHaptics || !user) {
      return;
    }

    setHapticsError(null);
    setPendingHapticsEnabled(enabled);
    setIsUpdatingHaptics(true);

    try {
      await updateHapticsEnabled(enabled);
      setPendingHapticsEnabled(null);
    } catch (error) {
      setPendingHapticsEnabled(null);
      setHapticsError(getAuthServiceErrorMessage(error, t('common:profile.haptics.saveFailed')));
    } finally {
      setIsUpdatingHaptics(false);
    }
  };

  const handleProviderToggle = async (providerId: OAuthProviderId) => {
    if (pendingAction) {
      return;
    }

    const authMethod = authMethods.find((item) => item.id === providerId);
    const isLinked = authMethod?.linked ?? false;

    if (isLinked && !authMethod?.canUnlink) {
      setAuthMethodsError(t('errors:auth.lastAuthMethodCannotBeRemoved'));
      return;
    }

    setAuthMethodsError(null);
    setPendingAction(getProviderPendingAction(providerId, isLinked ? 'unlink' : 'link'));

    try {
      if (isLinked) {
        await unlinkProvider(providerId);
      } else {
        await linkProvider(providerId);
      }
    } catch (error) {
      setAuthMethodsError(
        getAuthServiceErrorMessage(
          error,
          t(isLinked ? 'errors:auth.providerUnlinkFailed' : 'errors:auth.providerLinkFailed')
        )
      );
    } finally {
      setPendingAction(null);
    }
  };

  const handleDeleteAccount = async () => {
    setAccountDeletionError(null);
    setPendingAction('delete');

    try {
      await deleteAccount();
      router.replace(appRoutes.home);
    } catch (error) {
      setAccountDeletionError(
        getAuthServiceErrorMessage(error, t('errors:auth.deleteAccountFailed'))
      );
      setPendingAction(null);
    }
  };

  const openDeleteAccountConfirmation = () => {
    if (pendingAction) {
      return;
    }

    showAlert(
      t('common:profile.actions.deleteAccountTitle'),
      t('common:profile.actions.deleteAccountMessage'),
      [
        {
          text: t('common:buttons.cancel'),
          style: 'cancel',
        },
        {
          text: t('common:buttons.delete'),
          style: 'destructive',
          onPress: () => {
            void handleDeleteAccount();
          },
        },
      ]
    );
  };

  return {
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
    hasPasswordMethod,
    isDeletingAccount,
    isUpdatingDiscardPilePreference,
    isUpdatingHaptics,
    hapticsEnabled,
    hapticsError,
    openDeleteAccountConfirmation,
    openPasswordSettings,
    pendingAction,
    user,
  };
};
