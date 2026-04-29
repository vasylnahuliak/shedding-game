import { useState } from 'react';

import { MAX_PLAYER_NAME_LENGTH, parseWithSchema, PlayerNameSchema } from '@shedding-game/shared';

import { FormInput } from '@/components/FormInput';
import { useAuth } from '@/hooks/useAuthStore';
import { useAppTranslation } from '@/i18n';
import {
  getProfileSettingsAuthErrorMessage,
  hasProfileSettingsAuthErrorCode,
  ProfileSettingsInlineMessage,
  ProfileSettingsModalFrame,
  useProfileSettingsModalDismiss,
} from '@/screens/ProfileSettingsScreen/ProfileSettingsModalShared';

export default function EditProfileRoute() {
  const { t } = useAppTranslation(['common', 'auth', 'errors']);
  const dismiss = useProfileSettingsModalDismiss();
  const user = useAuth((state) => state.user);
  const updateProfile = useAuth((state) => state.updateProfile);
  const [displayNameDraft, setDisplayNameDraft] = useState(user?.name ?? '');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const normalizedDisplayName = parseWithSchema(PlayerNameSchema, displayNameDraft);
  const currentDisplayName = user?.name ?? '';
  const displayNameValid = normalizedDisplayName.length > 0;
  const hasChanges = normalizedDisplayName !== currentDisplayName;
  const canSave = !isSavingProfile && displayNameValid && hasChanges;

  const handleSave = async () => {
    if (!displayNameValid) {
      setProfileError(t('errors:auth.invalidName'));
      return;
    }

    if (!hasChanges) {
      setProfileError(null);
      return;
    }

    setProfileError(null);
    setIsSavingProfile(true);

    try {
      await updateProfile(normalizedDisplayName);
      dismiss();
    } catch (saveError) {
      console.log('Error saving profile changes:', saveError);
      if (hasProfileSettingsAuthErrorCode(saveError, 'AUTH_DISPLAY_NAME_TAKEN')) {
        setProfileError(t('errors:auth.usernameTaken'));
      } else {
        setProfileError(
          getProfileSettingsAuthErrorMessage(saveError, t('errors:auth.updateProfileFailed'))
        );
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <ProfileSettingsModalFrame
      title={t('common:profile.actions.editUsername')}
      subtitle={t('common:profile.editHint')}
      dismissible={!isSavingProfile}
      onClose={dismiss}
      buttons={[
        {
          variant: 'secondary',
          title: t('common:buttons.cancel'),
          onPress: dismiss,
          disabled: isSavingProfile,
        },
        {
          variant: 'success',
          title: isSavingProfile ? t('common:profile.actions.saving') : t('common:buttons.save'),
          onPress: () => void handleSave(),
          disabled: !canSave,
        },
      ]}
    >
      <FormInput
        label={t('auth:form.labels.displayName')}
        value={displayNameDraft}
        onChangeText={setDisplayNameDraft}
        maxLength={MAX_PLAYER_NAME_LENGTH}
        autoComplete="off"
        autoCorrect={false}
        autoCapitalize="none"
        spellCheck={false}
        placeholder={t('auth:form.placeholders.displayName')}
        returnKeyType="done"
        onSubmitEditing={() => void handleSave()}
      />

      {profileError ? <ProfileSettingsInlineMessage tone="error" message={profileError} /> : null}
    </ProfileSettingsModalFrame>
  );
}
