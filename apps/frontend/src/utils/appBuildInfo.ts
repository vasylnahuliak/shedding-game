import Constants from 'expo-constants';

const buildTime = new Date().toISOString().replace('T', ' ').slice(0, 16);
const version = Constants.expoConfig?.version ?? '0.0.0';

export const appBuildInfo = {
  buildTime,
  version,
} as const;
