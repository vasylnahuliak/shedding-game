import type {
  AppLocale,
  ClientSocketEvent,
  ClientSocketPayloadByEvent,
  ServerSocketEvent,
  ServerSocketPayloadByEvent,
} from '@shedding-game/shared';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';

import {
  resolveAppLocale,
  safeParseClientSocketEvent,
  safeParseServerSocketEvent,
} from '@shedding-game/shared';

import { API_URL } from '@/config';
import i18n from '@/i18n';

import { getAuthToken } from './index';
import { LoggingService } from './LoggingService';

const apiUrl = new URL(API_URL);
const SOCKET_ORIGIN = apiUrl.origin;
const SOCKET_PATH = `${apiUrl.pathname.replace(/\/+$/, '')}/socket.io/`;

let socket: Socket | null = null;

type LifecycleEvent = 'connect' | 'disconnect';
type SocketEvent = LifecycleEvent | ServerSocketEvent;
type PayloadlessServerEvent = {
  [TEvent in ServerSocketEvent]: ServerSocketPayloadByEvent[TEvent] extends undefined
    ? TEvent
    : never;
}[ServerSocketEvent];
type PayloadServerEvent = Exclude<ServerSocketEvent, PayloadlessServerEvent>;
type ListenerCallback<TEvent extends SocketEvent> = TEvent extends
  | LifecycleEvent
  | PayloadlessServerEvent
  ? () => void
  : (payload: ServerSocketPayloadByEvent[Extract<TEvent, PayloadServerEvent>]) => void;
type RawListener = (...args: readonly unknown[]) => void;

type Listener = {
  event: SocketEvent;
  callback: RawListener;
  wrappedCallback: RawListener;
};

let listeners: Listener[] = [];

const getResolvedLocale = (): AppLocale => resolveAppLocale(i18n.language);

const isLifecycleEvent = (event: SocketEvent): event is LifecycleEvent =>
  event === 'connect' || event === 'disconnect';

const toRawListener = <TEvent extends SocketEvent>(
  callback: ListenerCallback<TEvent>
): RawListener => callback as RawListener;

const createWrappedListener = <TEvent extends SocketEvent>(
  event: TEvent,
  callback: ListenerCallback<TEvent>
): RawListener => {
  if (isLifecycleEvent(event)) {
    return toRawListener(callback);
  }

  return (payload?: unknown) => {
    const result = safeParseServerSocketEvent(event, payload);

    if (!result.success) {
      LoggingService.warn(`Ignored invalid socket event payload for ${event}`, {
        issues: result.issues,
      });
      return;
    }

    if (result.output === undefined) {
      (callback as () => void)();
      return;
    }

    (
      callback as (payload: ServerSocketPayloadByEvent[Extract<TEvent, PayloadServerEvent>]) => void
    )(result.output as ServerSocketPayloadByEvent[Extract<TEvent, PayloadServerEvent>]);
  };
};

const on = <TEvent extends SocketEvent>(event: TEvent, callback: ListenerCallback<TEvent>) => {
  const rawCallback = toRawListener(callback);
  const wrappedCallback = createWrappedListener(event, callback);
  listeners.push({
    event,
    callback: rawCallback,
    wrappedCallback,
  });
  socket?.on(event, wrappedCallback as never);
};

const off = <TEvent extends SocketEvent>(event: TEvent, callback: ListenerCallback<TEvent>) => {
  const rawCallback = toRawListener(callback);
  const matchingListeners = listeners.filter((listener) => {
    return listener.event === event && listener.callback === rawCallback;
  });

  listeners = listeners.filter((listener) => {
    return listener.event !== event || listener.callback !== rawCallback;
  });

  for (const listener of matchingListeners) {
    socket?.off(event, listener.wrappedCallback as never);
  }
};

const emit = <TEvent extends ClientSocketEvent>(
  event: TEvent,
  payload: ClientSocketPayloadByEvent[TEvent]
) => {
  const result = safeParseClientSocketEvent(event, payload);

  if (!result.success) {
    LoggingService.error(`Blocked invalid socket emit for ${event}`, result.issues);
    return;
  }

  socket?.emit(event, result.output);
};

export const SocketService = {
  connect: () => {
    const token = getAuthToken();
    if (!token) return;

    if (socket && socket.connected) return;

    if (!socket) {
      socket = io(SOCKET_ORIGIN, {
        auth: {
          token,
          locale: getResolvedLocale(),
        },
        path: SOCKET_PATH,
        transports: ['websocket'],
      });

      socket.on('connect', () => {
        console.log('Connected to socket server');
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from socket server');
      });

      listeners.forEach(({ event, wrappedCallback }) => {
        socket?.on(event, wrappedCallback);
      });
    } else if (!socket.connected) {
      socket.auth = {
        token,
        locale: getResolvedLocale(),
      };
      socket.connect();
    }
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  on,
  off,
  emit,

  updateLocale: (locale: AppLocale) => {
    emit('set_locale', { locale });
  },

  getSocket: () => socket,
};
