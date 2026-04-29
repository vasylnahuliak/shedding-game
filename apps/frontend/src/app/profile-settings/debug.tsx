import { useAlert } from '@/components/AlertProvider';
import { useAppTranslation } from '@/i18n';
import { DebugInfoContent, useDebugInfo } from '@/screens/AdminScreen/DebugInfo';
import {
  ProfileSettingsModalFrame,
  useProfileSettingsModalDismiss,
} from '@/screens/ProfileSettingsScreen/ProfileSettingsModalShared';

export default function ProfileSettingsDebugRoute() {
  const { t } = useAppTranslation(['admin', 'common', 'alerts']);
  const { showAlert } = useAlert();
  const dismiss = useProfileSettingsModalDismiss();
  const { lines, handleCopy } = useDebugInfo();

  const handleCopyAndClose = async () => {
    await handleCopy();
    dismiss();
    showAlert(t('alerts:titles.copied'), t('alerts:messages.copyDebugDataSuccess'));
  };

  return (
    <ProfileSettingsModalFrame
      title={t('admin:debug.title')}
      subtitle={t('common:profile.debugHint')}
      dismissible
      onClose={dismiss}
      buttons={[
        {
          variant: 'secondary',
          title: t('common:labels.copy'),
          onPress: () => void handleCopyAndClose(),
        },
        { title: t('common:buttons.close'), onPress: dismiss },
      ]}
    >
      <DebugInfoContent lines={lines} />
    </ProfileSettingsModalFrame>
  );
}
