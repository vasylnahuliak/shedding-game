import type {
  AppLocale,
  BackendMessageCode,
  BackendMessageParamsByCode,
  LocalizedMessagePayload,
} from '@shedding-game/shared';
import type { Response } from 'express';
import type { Socket } from 'socket.io';

import {
  buildLocalizedMessage,
  LocalizedMessageSchema,
  parseWithSchema,
} from '@shedding-game/shared';

import {
  clearExpectedHttpErrorMetadata,
  getDefaultHandledHttpLogLevel,
  setExpectedHttpErrorMetadata,
} from './httpErrors';
import { emitServerSocketEvent } from './socketEvents';

type MessageParams<Code extends BackendMessageCode> = Exclude<
  BackendMessageParamsByCode[Code],
  undefined
>;

export const buildMessage = <Code extends BackendMessageCode>(
  locale: AppLocale,
  code: Code,
  params?: MessageParams<Code>
): LocalizedMessagePayload<Code> => {
  const payload = buildLocalizedMessage(locale, code, params);
  parseWithSchema(LocalizedMessageSchema, payload);
  return payload;
};

export const apiError = <Code extends BackendMessageCode>(
  res: Response,
  locale: AppLocale,
  status: number,
  code: Code,
  params?: MessageParams<Code>
) => {
  if (status >= 400 && status < 500) {
    setExpectedHttpErrorMetadata(res, {
      statusCode: status,
      code,
      logLevel: getDefaultHandledHttpLogLevel(status),
    });
  } else {
    clearExpectedHttpErrorMetadata(res);
  }

  res.status(status).json(buildMessage(locale, code, params));
};

export const emitSocketError = <Code extends BackendMessageCode>(
  socket: Socket,
  locale: AppLocale,
  code: Code,
  params?: MessageParams<Code>
) => {
  emitServerSocketEvent(socket, 'error', buildMessage(locale, code, params));
};
