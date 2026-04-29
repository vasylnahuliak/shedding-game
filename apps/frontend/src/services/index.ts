import ky, { HTTPError } from 'ky';

import { resolveAppLocale } from '@shedding-game/shared';

import { API_URL } from '@/config';
import i18n from '@/i18n';

import { LoggingService } from './LoggingService';

let authToken: string | null = null;
let onUnauthorizedCallback: (() => void) | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

export const setOnUnauthorized = (callback: (() => void) | null) => {
  onUnauthorizedCallback = callback;
};

export const api = ky.create({
  prefixUrl: API_URL,
  hooks: {
    beforeRequest: [
      (request) => {
        if (authToken) {
          request.headers.set('Authorization', `Bearer ${authToken}`);
        }
        request.headers.set('Accept-Language', resolveAppLocale(i18n.language));
      },
    ],
    afterResponse: [
      async (request, _options, response) => {
        // Log successful requests in debug mode
        if (response.ok) {
          LoggingService.debug(`API ${request.method} ${request.url}`, {
            status: response.status,
          });
        }

        // Handle 401 - session expired
        if (response.status === 401 && onUnauthorizedCallback) {
          onUnauthorizedCallback();
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
