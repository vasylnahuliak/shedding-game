import { Platform } from 'react-native';

import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

import { AuthServiceError } from './authService.errors';
import type { AppleSignInResult } from './authService.types';

const createRandomNonce = () => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = 32;
  const cryptoApi = globalThis.crypto;

  if (cryptoApi?.getRandomValues) {
    const values = new Uint8Array(length);
    cryptoApi.getRandomValues(values);
    return Array.from(values, (value) => alphabet[value % alphabet.length]).join('');
  }

  return Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join(
    ''
  );
};

const hashNonce = (nonce: string) =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, nonce, {
    encoding: Crypto.CryptoEncoding.HEX,
  });

const isErrorWithCode = (error: unknown, expectedCode: string) =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === expectedCode;

export const requestAppleIdToken = async (
  fallbackMessage: string,
  unavailableCode: string
): Promise<AppleSignInResult> => {
  if (Platform.OS !== 'ios') {
    throw new AuthServiceError(fallbackMessage, unavailableCode);
  }

  const isAppleAuthenticationAvailable = await AppleAuthentication.isAvailableAsync();

  if (!isAppleAuthenticationAvailable) {
    throw new AuthServiceError(fallbackMessage, unavailableCode);
  }

  const nonce = createRandomNonce();
  const hashedNonce = await hashNonce(nonce);

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!credential.identityToken) {
      throw new AuthServiceError(fallbackMessage, 'AUTH_FAILED');
    }

    return {
      token: credential.identityToken,
      nonce,
    };
  } catch (error) {
    if (isErrorWithCode(error, 'ERR_REQUEST_CANCELED')) {
      return null;
    }

    throw error;
  }
};
