import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';

import type {
  AsyncStorageLike,
  PendingAuthRedirectIntent,
  SupabaseAuthStorageAccess,
} from './authService.types';
import { setAuthToken } from './index';
import { supabase } from './supabase';

const PASSWORD_RECOVERY_STORAGE_KEY = 'auth.passwordRecoveryPending';
const PENDING_AUTH_REDIRECT_INTENT_STORAGE_KEY = 'auth.pendingRedirectIntent';

export const setPasswordRecoveryStorage = async (isPending: boolean) => {
  if (isPending) {
    await AsyncStorage.setItem(PASSWORD_RECOVERY_STORAGE_KEY, '1');
    return;
  }

  await AsyncStorage.removeItem(PASSWORD_RECOVERY_STORAGE_KEY);
};

export const getPasswordRecoveryStorage = async () =>
  (await AsyncStorage.getItem(PASSWORD_RECOVERY_STORAGE_KEY)) === '1';

export const getPasswordResetRedirectTo = () => Linking.createURL('/');

export const getEmailSignInRedirectTo = () => Linking.createURL('/');

export const getOAuthRedirectTo = () => Linking.createURL('/');

export const setPendingAuthRedirectIntent = async (intent: PendingAuthRedirectIntent | null) => {
  if (!intent) {
    await AsyncStorage.removeItem(PENDING_AUTH_REDIRECT_INTENT_STORAGE_KEY);
    return;
  }

  await AsyncStorage.setItem(PENDING_AUTH_REDIRECT_INTENT_STORAGE_KEY, intent);
};

export const getPendingAuthRedirectIntent = async (): Promise<PendingAuthRedirectIntent | null> => {
  const value = await AsyncStorage.getItem(PENDING_AUTH_REDIRECT_INTENT_STORAGE_KEY);

  if (value === 'sign_in' || value === 'link_identity' || value === 'password_recovery') {
    return value;
  }

  return null;
};

const clearPersistedSupabaseSession = async () => {
  const authStorage = supabase.auth as typeof supabase.auth & SupabaseAuthStorageAccess;
  const storageKey = authStorage.storageKey;
  const storage = authStorage.storage;

  if (!storageKey || !storage?.removeItem) {
    return;
  }

  const removeItem = async (target: AsyncStorageLike | null | undefined, key: string) => {
    if (!target?.removeItem) {
      return;
    }

    try {
      await Promise.resolve(target.removeItem(key));
    } catch {
      // Ignore storage cleanup failures and continue clearing the rest of the auth state.
    }
  };

  await removeItem(storage, storageKey);
  await removeItem(storage, `${storageKey}-code-verifier`);
  await removeItem(storage, `${storageKey}-user`);
  await removeItem(authStorage.userStorage, `${storageKey}-user`);
};

export const clearLocalSession = async ({
  revokeRemoteSession = true,
}: { revokeRemoteSession?: boolean } = {}) => {
  setAuthToken(null);

  if (revokeRemoteSession) {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // Ignore sign-out failures and clear the local session anyway.
    }
  } else {
    await clearPersistedSupabaseSession();
  }

  await setPasswordRecoveryStorage(false);
  await setPendingAuthRedirectIntent(null);
};
