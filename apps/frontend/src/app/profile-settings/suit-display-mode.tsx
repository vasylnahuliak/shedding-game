import { useState } from 'react';

import type { SuitDisplayMode } from '@shedding-game/shared';

import { DEFAULT_SUIT_DISPLAY_MODE, SUIT_DISPLAY_MODES, SUITS } from '@shedding-game/shared';

import { SuitGlyph } from '@/components/Card';
import { Box } from '@/components/ui/box';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { useAuth } from '@/hooks/useAuthStore';
import { useAppTranslation } from '@/i18n';
import {
  createProfileSettingsSaveButtons,
  getProfileSettingsAuthErrorMessage,
  ProfileSettingsInlineMessage,
  ProfileSettingsModalFrame,
  useProfileSettingsModalDismiss,
} from '@/screens/ProfileSettingsScreen/ProfileSettingsModalShared';
import { badgeBaseClassNames, badgeToneClassNames, panelClassNames } from '@/theme';

const SuitPreview = ({ mode }: { mode: SuitDisplayMode }) => (
  <Box className="flex-row items-center gap-2">
    {SUITS.map((suit) => (
      <Box
        key={suit}
        className="h-10 w-9 items-center justify-center rounded-[8px] border border-border-card-face bg-surface-card-face"
      >
        <SuitGlyph className="text-[22px] font-extrabold" suit={suit} suitDisplayMode={mode} />
      </Box>
    ))}
  </Box>
);

export default function SuitDisplayModeRoute() {
  const { t } = useAppTranslation(['common', 'errors']);
  const dismiss = useProfileSettingsModalDismiss();
  const user = useAuth((state) => state.user);
  const updateSuitDisplayMode = useAuth((state) => state.updateSuitDisplayMode);
  const currentMode = user?.suitDisplayMode ?? DEFAULT_SUIT_DISPLAY_MODE;
  const [draftMode, setDraftMode] = useState<SuitDisplayMode>(currentMode);
  const [modeError, setModeError] = useState<string | null>(null);
  const [isSavingMode, setIsSavingMode] = useState(false);

  const hasChanges = draftMode !== currentMode;
  const canSave = Boolean(user) && hasChanges && !isSavingMode;

  const handleClose = () => {
    if (!isSavingMode) {
      dismiss();
    }
  };

  const handleSave = async () => {
    if (!canSave) {
      return;
    }

    setModeError(null);
    setIsSavingMode(true);

    try {
      await updateSuitDisplayMode(draftMode);
      dismiss();
    } catch (error) {
      setModeError(
        getProfileSettingsAuthErrorMessage(error, t('common:profile.suitDisplay.saveFailed'))
      );
    } finally {
      setIsSavingMode(false);
    }
  };

  return (
    <ProfileSettingsModalFrame
      title={t('common:profile.suitDisplay.title')}
      subtitle={t('common:profile.suitDisplay.modalSubtitle')}
      dismissible={!isSavingMode}
      onClose={handleClose}
      buttons={createProfileSettingsSaveButtons({
        canSave,
        cancelTitle: t('common:buttons.cancel'),
        isSaving: isSavingMode,
        onCancel: handleClose,
        onSave: () => void handleSave(),
        saveTitle: isSavingMode ? t('common:profile.actions.saving') : t('common:buttons.save'),
      })}
    >
      <Box className="gap-3">
        {SUIT_DISPLAY_MODES.map((mode) => {
          const isSelected = mode === draftMode;

          return (
            <Pressable
              key={mode}
              className={mergeClassNames(
                panelClassNames.strong,
                'gap-3 rounded-[20px] p-4',
                isSelected && 'border-border-accent bg-surface-badge-accent'
              )}
              onPress={() => setDraftMode(mode)}
              disabled={isSavingMode}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected, disabled: isSavingMode }}
            >
              <Box className="flex-row items-start justify-between gap-3">
                <Box className="min-w-0 flex-1 gap-1">
                  <Text className="text-[17px] font-extrabold text-text-primary">
                    {t(`common:profile.suitDisplay.modes.${mode}.label`)}
                  </Text>
                  <Text className="text-[13px] leading-5 text-text-tertiary">
                    {t(`common:profile.suitDisplay.modes.${mode}.description`)}
                  </Text>
                </Box>

                {isSelected ? (
                  <Box
                    className={mergeClassNames(
                      badgeBaseClassNames.chip,
                      badgeToneClassNames.accentSurfaceStrong
                    )}
                  >
                    <Text className="text-[11px] font-bold uppercase tracking-[0.8px] text-text-accent">
                      {t('common:profile.suitDisplay.selected')}
                    </Text>
                  </Box>
                ) : null}
              </Box>

              <SuitPreview mode={mode} />
            </Pressable>
          );
        })}

        {modeError ? <ProfileSettingsInlineMessage tone="error" message={modeError} /> : null}
      </Box>
    </ProfileSettingsModalFrame>
  );
}
