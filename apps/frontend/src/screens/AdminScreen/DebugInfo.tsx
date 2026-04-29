import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import * as Clipboard from 'expo-clipboard';
import Constants from 'expo-constants';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { API_URL, APP_ENV } from '@/config';
import { useAuth } from '@/hooks/useAuthStore';
import { useAppTranslation } from '@/i18n';
import { SocketService } from '@/services/SocketService';
import { appBuildInfo } from '@/utils/appBuildInfo';

const useDebugLines = () => {
  const { t } = useAppTranslation(['admin']);
  const user = useAuth((state) => state.user);
  const [socketConnected, setSocketConnected] = useState(
    () => SocketService.getSocket()?.connected ?? false
  );

  useEffect(function pollSocketConnectionStatus() {
    const interval = setInterval(() => {
      setSocketConnected(SocketService.getSocket()?.connected ?? false);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const socket = SocketService.getSocket();
  const socketStatus = socketConnected ? t('admin:debug.connected') : t('admin:debug.disconnected');
  const socketValue = `${socketStatus}${socket?.id ? ` (${socket.id})` : ''}`;
  const envValue = t(`admin:debug.${APP_ENV}`);
  const userValue = user ? `${user.name} (${user.id})` : t('admin:debug.notLoggedIn');

  const lines = [
    t('admin:debug.appVersion', { value: appBuildInfo.version }),
    t('admin:debug.buildTime', { value: appBuildInfo.buildTime }),
    t('admin:debug.env', { value: envValue }),
    t('admin:debug.platform', { value: `${Platform.OS} ${Platform.Version}` }),
    t('admin:debug.expoSdk', { value: Constants.expoConfig?.sdkVersion ?? '?' }),
    t('admin:debug.api', { value: API_URL }),
    t('admin:debug.socket', { value: socketValue }),
    t('admin:debug.user', { value: userValue }),
  ];

  return { lines, text: lines.join('\n') };
};

export const useDebugInfo = () => {
  const { lines, text } = useDebugLines();

  const handleCopy = async () => {
    await Clipboard.setStringAsync(text);
  };

  return {
    lines,
    handleCopy,
  };
};

export const DebugInfoContent = ({ lines }: { lines: string[] }) => {
  return (
    <Box className="mt-sm rounded-lg border border-border-subtle bg-surface-card p-[14px]">
      {lines.map((line, i) => (
        <Text
          key={i}
          className="text-xs leading-5 text-text-primary"
          style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}
          selectable
        >
          {line}
        </Text>
      ))}
    </Box>
  );
};
