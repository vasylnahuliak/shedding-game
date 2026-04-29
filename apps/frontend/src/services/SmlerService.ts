import { Platform } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import type { Href } from 'expo-router';

import { SMLER_DOMAIN } from '@/config';
import { appRoutes } from '@/navigation/appRoutes';

import { LoggingService } from './LoggingService';

const SMLER_RESOLVE_LINK_URL = 'https://smler.in/api/v1/short';
const SMLER_TRACK_CONVERSION_URL = 'https://smler.in/api/v2/track';
const SMLER_FIRST_LAUNCH_KEY = 'smler.firstLaunchHandled';
const SMLER_INSTALL_CONVERSION_TRACKED_KEY = 'smler.installConversionTracked';

type SmlerDeepLink = {
  deepLink: string;
  shortCode: string;
  domain: string;
  clickId?: string;
};

type ResolvedSmlerDestination = {
  href: Href;
  sourceLink: SmlerDeepLink;
};

const parseUrl = (value: string) => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

const isKnownSmlerHost = (host: string) =>
  host === SMLER_DOMAIN || host.endsWith(`.${SMLER_DOMAIN}`);

const getUrlPathname = (url: URL) => {
  if (url.protocol === 'http:' || url.protocol === 'https:') {
    return url.pathname;
  }

  const joinedPath = [url.host, url.pathname].filter(Boolean).join('/');
  return `/${joinedPath}`.replace(/\/+/g, '/');
};

const parseSmlerDeepLink = (urlValue: string | null | undefined): SmlerDeepLink | null => {
  if (!urlValue) {
    return null;
  }

  const parsedUrl = parseUrl(urlValue);
  if (!parsedUrl || !isKnownSmlerHost(parsedUrl.host)) {
    return null;
  }

  const shortCode = parsedUrl.pathname.replace(/^\/+/, '').split('/')[0];
  if (!shortCode) {
    return null;
  }

  return {
    deepLink: parsedUrl.toString(),
    shortCode,
    domain: parsedUrl.host,
    clickId: parsedUrl.searchParams.get('clickId') ?? undefined,
  };
};

const resolveDestinationHref = (destinationUrl: string): Href | null => {
  const parsedUrl = parseUrl(destinationUrl);
  if (!parsedUrl) {
    return null;
  }

  const pathname = getUrlPathname(parsedUrl);
  if (pathname !== '/lobby') {
    return null;
  }

  const roomId = parsedUrl.searchParams.get('roomId');
  if (!roomId) {
    return null;
  }

  return appRoutes.lobby({ roomId });
};

const resolveTrackOpenDestinationUrl = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Smler track open response payload is invalid');
  }

  const link = 'link' in payload ? payload.link : null;
  if (!link || typeof link !== 'object') {
    throw new Error('Smler track open response did not include link data');
  }

  const destinationUrl = 'url' in link ? link.url : null;
  if (typeof destinationUrl !== 'string' || destinationUrl.trim().length === 0) {
    throw new Error('Smler track open response did not include a destination URL');
  }

  return destinationUrl;
};

const readResponseText = async (response: Response) => {
  try {
    return await response.text();
  } catch {
    return '';
  }
};

const buildResolveLinkUrl = (sourceLink: SmlerDeepLink) => {
  const requestUrl = new URL(SMLER_RESOLVE_LINK_URL);
  requestUrl.searchParams.set('shortCode', sourceLink.shortCode);
  requestUrl.searchParams.set('domain', sourceLink.domain);
  return requestUrl.toString();
};

const trackSmlerDeepLinkOpen = async (
  sourceLink: SmlerDeepLink
): Promise<ResolvedSmlerDestination> => {
  const response = await fetch(buildResolveLinkUrl(sourceLink));

  if (!response.ok) {
    const responseBody = await readResponseText(response);
    throw new Error(
      `Smler resolve link request failed with ${String(response.status)} ${response.statusText}: ${responseBody}`
    );
  }

  const payload: unknown = await response.json();
  const destinationUrl = resolveTrackOpenDestinationUrl(payload);
  const href = resolveDestinationHref(destinationUrl);

  if (!href) {
    throw new Error(`Unsupported Smler destination URL: ${destinationUrl}`);
  }

  return {
    href,
    sourceLink,
  };
};

const decodeRepeatedly = (value: string) => {
  let decodedValue = value;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const nextValue = decodeURIComponent(decodedValue);
      if (nextValue === decodedValue) {
        break;
      }
      decodedValue = nextValue;
    } catch {
      break;
    }
  }

  return decodedValue;
};

const extractDeepLinkFromInstallReferrer = (installReferrer: string) => {
  const normalizedReferrer = installReferrer.includes('://')
    ? installReferrer
    : `https://smler.local/?${installReferrer.replace(/^\?/, '')}`;
  const referrerUrl = parseUrl(normalizedReferrer);
  if (!referrerUrl) {
    return null;
  }

  const deepLinkParam = referrerUrl.searchParams.get('deepLink');
  if (!deepLinkParam) {
    return null;
  }

  return decodeRepeatedly(deepLinkParam);
};

const isClipboardDeferredDeepLink = (value: string) => {
  const parsedUrl = parseUrl(value);
  return Boolean(parsedUrl && isKnownSmlerHost(parsedUrl.host));
};

const markFirstLaunchHandled = async () => {
  const isAlreadyHandled = await AsyncStorage.getItem(SMLER_FIRST_LAUNCH_KEY);
  if (isAlreadyHandled === '1') {
    return false;
  }

  await AsyncStorage.setItem(SMLER_FIRST_LAUNCH_KEY, '1');
  return true;
};

const readAndroidDeferredDeepLink = async () => {
  try {
    const module = (await import('react-native-play-install-referrer')) as {
      PlayInstallReferrer: {
        getInstallReferrerInfo: (
          callback: (
            installReferrerInfo: { installReferrer?: string | null } | null,
            error?: { responseCode?: string | number; message?: string } | null
          ) => void
        ) => void;
      };
    };

    return await new Promise<string | null>((resolve) => {
      module.PlayInstallReferrer.getInstallReferrerInfo((installReferrerInfo, error) => {
        if (error || !installReferrerInfo?.installReferrer) {
          if (error) {
            LoggingService.warn('Failed to read Play Install Referrer', {
              responseCode: error.responseCode,
              message: error.message,
            });
          }
          resolve(null);
          return;
        }

        resolve(extractDeepLinkFromInstallReferrer(installReferrerInfo.installReferrer));
      });
    });
  } catch (error) {
    LoggingService.warn('Failed to load Play Install Referrer integration', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
};

const readIosDeferredDeepLink = async () => {
  try {
    const clipboardValue = await Clipboard.getStringAsync();
    return clipboardValue && isClipboardDeferredDeepLink(clipboardValue) ? clipboardValue : null;
  } catch (error) {
    LoggingService.warn('Failed to read clipboard for deferred deep link', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
};

export const resolveIncomingSmlerLink = async (urlValue: string | null | undefined) => {
  const sourceLink = parseSmlerDeepLink(urlValue);
  if (!sourceLink) {
    return null;
  }

  return trackSmlerDeepLinkOpen(sourceLink);
};

export const resolveDeferredSmlerLinkOnFirstLaunch = async () => {
  const shouldHandleFirstLaunch = await markFirstLaunchHandled();
  if (!shouldHandleFirstLaunch) {
    return null;
  }

  const deferredDeepLink =
    Platform.OS === 'android'
      ? await readAndroidDeferredDeepLink()
      : await readIosDeferredDeepLink();

  if (!deferredDeepLink) {
    return null;
  }

  const sourceLink = parseSmlerDeepLink(deferredDeepLink);
  if (!sourceLink) {
    return null;
  }

  return trackSmlerDeepLinkOpen(sourceLink);
};

export const trackDeferredSmlerConversion = async (sourceLink: SmlerDeepLink) => {
  if (!sourceLink.clickId) {
    return;
  }

  const hasTrackedConversion = await AsyncStorage.getItem(SMLER_INSTALL_CONVERSION_TRACKED_KEY);
  if (hasTrackedConversion === '1') {
    return;
  }

  const response = await fetch(
    `${SMLER_TRACK_CONVERSION_URL}/${encodeURIComponent(sourceLink.clickId)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shortCode: sourceLink.shortCode,
        domain: sourceLink.domain,
      }),
    }
  );

  if (!response.ok) {
    const responseBody = await readResponseText(response);
    throw new Error(
      `Smler conversion tracking failed with ${String(response.status)} ${response.statusText}: ${responseBody}`
    );
  }

  await AsyncStorage.setItem(SMLER_INSTALL_CONVERSION_TRACKED_KEY, '1');
};
