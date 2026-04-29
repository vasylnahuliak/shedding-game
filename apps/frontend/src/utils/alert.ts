import { type AlertButton, getGlobalShowAlert } from '@/components/AlertProvider';
import i18n from '@/i18n';

export const showAlert = (
  title: string,
  message: string,
  buttons: AlertButton[] = [{ text: i18n.t('common:buttons.ok') }]
) => {
  const globalShowAlert = getGlobalShowAlert();
  if (globalShowAlert) {
    globalShowAlert(title, message, buttons);
  } else {
    console.warn('AlertProvider not mounted. Cannot show alert:', title);
  }
};

export const showErrorAlert = (title: string, message: string) => {
  showAlert(title, message, [{ text: i18n.t('common:buttons.ok') }]);
};
