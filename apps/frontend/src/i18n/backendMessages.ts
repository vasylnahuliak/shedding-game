import type { BackendMessageCode, RoomClosedEvent } from '@shedding-game/shared';

import { BACKEND_MESSAGE_CODES } from '@shedding-game/shared';

import i18n from './index';

type MessageParams = Record<string, string | number>;

export type BackendMessageLike = {
  code?: string;
  message?: string;
  params?: MessageParams;
};

export type RoomClosedPayload = RoomClosedEvent;

const BACKEND_MESSAGE_CODE_SET = new Set<BackendMessageCode>(BACKEND_MESSAGE_CODES);

const isBackendMessageCode = (value: unknown): value is BackendMessageCode => {
  return typeof value === 'string' && BACKEND_MESSAGE_CODE_SET.has(value as BackendMessageCode);
};

export const translateBackendMessage = (
  payload: BackendMessageLike | null | undefined,
  fallbackMessage: string
): string => {
  if (payload?.code && isBackendMessageCode(payload.code)) {
    const translationKey = `errors:backend.${payload.code}`;
    if (i18n.exists(translationKey)) {
      return i18n.t(translationKey, {
        ...(payload.params ?? {}),
        defaultValue: payload.message ?? fallbackMessage,
      });
    }
  }

  if (typeof payload?.message === 'string' && payload.message.trim().length > 0) {
    return payload.message;
  }

  return fallbackMessage;
};

export const getRoomClosedReasonMessage = (
  payload: RoomClosedPayload,
  fallbackMessage: string
): string => {
  return (
    payload.reason ||
    translateBackendMessage(
      {
        code: payload.reasonCode,
        params: payload.reasonParams,
        message: payload.reasonMessage,
      },
      fallbackMessage
    )
  );
};
