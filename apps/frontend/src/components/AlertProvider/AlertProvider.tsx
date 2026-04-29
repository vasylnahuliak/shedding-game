import { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler } from 'react-native';

import type { ButtonVariant } from '@/components/Button';
import { Button } from '@/components/Button';
import {
  modalContentClassName,
  modalContentNarrowClassName,
  modalOverlayClassName,
} from '@/components/Modal';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { useAppTranslation } from '@/i18n';

export interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

const BUTTON_VARIANT: Record<NonNullable<AlertButton['style']>, ButtonVariant> = {
  default: 'primary',
  cancel: 'secondary',
  destructive: 'danger',
};

interface AlertState {
  id: number;
  title: string;
  message: string;
  buttons: AlertButton[];
}

interface AlertContextType {
  showAlert: (title: string, message: string, buttons?: AlertButton[]) => void;
  currentAlert: AlertState | null;
  hideAlert: () => void;
  activeHostId: number | null;
  registerHost: (hostId: number) => void;
  unregisterHost: (hostId: number) => void;
}

const AlertContext = createContext<AlertContextType | null>(null);

export function useAlert() {
  const context = use(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider');
  }
  return context;
}

// Global reference for imperative API
let globalShowAlert: AlertContextType['showAlert'] | null = null;
let nextAlertHostId = 0;

export function getGlobalShowAlert() {
  return globalShowAlert;
}

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const { t } = useAppTranslation('common');
  const [queue, setQueue] = useState<AlertState[]>([]);
  const [hostIds, setHostIds] = useState<number[]>([]);
  const nextAlertIdRef = useRef(0);
  const currentAlert = queue[0] ?? null;
  const activeHostId = hostIds[hostIds.length - 1] ?? null;

  const hideAlert = useCallback(() => {
    setQueue((prev) => prev.slice(1));
  }, []);

  const showAlert = useCallback(
    (title: string, message: string, buttons: AlertButton[] = [{ text: t('buttons.ok') }]) => {
      const resolvedButtons = buttons.length > 0 ? buttons : [{ text: t('buttons.ok') }];

      setQueue((prev) => [
        ...prev,
        {
          id: ++nextAlertIdRef.current,
          title,
          message,
          buttons: resolvedButtons,
        },
      ]);
    },
    [t]
  );

  const registerHost = useCallback((hostId: number) => {
    setHostIds((prev) => (prev.includes(hostId) ? prev : [...prev, hostId]));
  }, []);

  const unregisterHost = useCallback((hostId: number) => {
    setHostIds((prev) => prev.filter((id) => id !== hostId));
  }, []);

  useEffect(
    function registerGlobalAlertHandler() {
      globalShowAlert = showAlert;

      return () => {
        if (globalShowAlert === showAlert) {
          globalShowAlert = null;
        }
      };
    },
    [showAlert]
  );

  useEffect(
    function subscribeToHardwareBackForAlerts() {
      if (!currentAlert) {
        return;
      }

      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        hideAlert();
        return true;
      });

      return () => {
        subscription.remove();
      };
    },
    [currentAlert, hideAlert]
  );

  const contextValue = useMemo(
    () => ({
      showAlert,
      currentAlert,
      hideAlert,
      activeHostId,
      registerHost,
      unregisterHost,
    }),
    [activeHostId, currentAlert, hideAlert, registerHost, showAlert, unregisterHost]
  );

  return <AlertContext.Provider value={contextValue}>{children}</AlertContext.Provider>;
}

export function AlertViewport() {
  const { currentAlert, hideAlert, activeHostId, registerHost, unregisterHost } = useAlert();
  const hostIdRef = useRef<number>(++nextAlertHostId);
  const hostId = hostIdRef.current;

  useEffect(
    function registerAlertViewportHost() {
      registerHost(hostId);
      return () => {
        unregisterHost(hostId);
      };
    },
    [hostId, registerHost, unregisterHost]
  );

  if (!currentAlert || hostId !== activeHostId) {
    return null;
  }

  const handleButtonPress = (button: AlertButton) => {
    hideAlert();
    button.onPress?.();
  };

  return (
    <Box className="absolute inset-0 z-[1000]" pointerEvents="box-none">
      <Box className={modalOverlayClassName}>
        <Box
          accessibilityViewIsModal
          className={mergeClassNames(
            'box-shadow-modal',
            modalContentClassName,
            modalContentNarrowClassName
          )}
        >
          <Box className="items-center">
            <Text className="mb-3 text-center text-[20px] font-bold text-text-primary">
              {currentAlert.title}
            </Text>
            <Text className="mb-5 text-center text-[16px] leading-[22px] text-text-tertiary">
              {currentAlert.message}
            </Text>
            <Box className="w-full items-center gap-2.5">
              {currentAlert.buttons.map((button, index) => (
                <Button
                  key={`${currentAlert.id}-${index}`}
                  title={button.text}
                  variant={BUTTON_VARIANT[button.style ?? 'default']}
                  onPress={() => handleButtonPress(button)}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
