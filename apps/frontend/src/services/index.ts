import ky, { HTTPError } from 'ky';

import { resolveAppLocale } from '@shedding-game/shared';

import { API_URL } from '@/config';
import i18n from '@/i18n';

import { refreshAuthSession } from './authSession';
import { getAuthToken } from './authToken';
import { LoggingService } from './LoggingService';

let onUnauthorizedCallback: (() => void) | null = null;

export const setOnUnauthorized = (callback: (() => void) | null) => {
  onUnauthorizedCallback = callback;
};

const getAuthorizationHeader = (token: string) => `Bearer ${token}`;

export const api = ky.create({
  prefixUrl: API_URL,
  hooks: {
    beforeRequest: [
      (request) => {
        const authToken = getAuthToken();
        if (authToken) {
          request.headers.set('Authorization', getAuthorizationHeader(authToken));
        }
        request.headers.set('Accept-Language', resolveAppLocale(i18n.language));
      },
    ],
    afterResponse: [
      async (request, _options, response, { retryCount }) => {
        // Log successful requests in debug mode
        if (response.ok) {
          LoggingService.debug(`API ${request.method} ${request.url}`, {
            status: response.status,
          });
        }

        if (response.status === 401) {
          const requestAuthorization = request.headers.get('Authorization');

          if (retryCount === 0 && requestAuthorization) {
            const currentToken = getAuthToken();
            const currentAuthorization = currentToken ? getAuthorizationHeader(currentToken) : null;

            if (currentAuthorization && currentAuthorization !== requestAuthorization) {
              return ky.retry({ code: 'AUTH_TOKEN_SYNCED' });
            }

            const refreshedToken = await refreshAuthSession();
            if (refreshedToken) {
              return ky.retry({ code: 'AUTH_TOKEN_REFRESHED' });
            }
          }

          if (onUnauthorizedCallback) {
            onUnauthorizedCallback();
          }
        }

        return response;
      },
    ],
    beforeError: [
      async (error) => {
        const { request, response } = error;

        let responseBody: unknown;
        try {
          responseBody = await response?.clone().json();
        } catch {
          try {
            responseBody = await response?.clone().text();
          } catch {
            responseBody = undefined;
          }
        }

        LoggingService.apiError(`${request.method} ${request.url} failed`, error, {
          url: request.url,
          method: request.method,
          status: response?.status,
          responseBody,
        });

        return error;
      },
    ],
  },
});

export { HTTPError };
