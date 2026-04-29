import {
  parseServerSocketEvent,
  type ServerSocketEvent,
  type ServerSocketPayloadByEvent,
} from '@shedding-game/shared';

type SocketEmitter = {
  emit: (event: string, payload?: unknown) => unknown;
};

export const emitServerSocketEvent = <TEvent extends ServerSocketEvent>(
  emitter: SocketEmitter,
  event: TEvent,
  payload: ServerSocketPayloadByEvent[TEvent]
) => {
  const validatedPayload = parseServerSocketEvent(event, payload);

  if (validatedPayload === undefined) {
    emitter.emit(event);
    return;
  }

  emitter.emit(event, validatedPayload);
};
