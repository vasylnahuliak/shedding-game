import type { AppSocketServer } from './socketTypes';

let socketServer: AppSocketServer | null = null;

export const setSocketServer = (server: AppSocketServer | null): void => {
  socketServer = server;
};

export const getSocketServer = (): AppSocketServer | null => socketServer;
