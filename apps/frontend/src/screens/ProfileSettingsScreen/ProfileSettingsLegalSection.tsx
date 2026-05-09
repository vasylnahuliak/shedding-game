import { ProfileSectionCard } from '@/components/ProfileSectionCard';
import { ProfileShortcutCard } from '@/components/ProfileShortcutCard';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { useAppTranslation } from '@/i18n';
import { openPrivacyPolicy, openTermsOfUse } from '@/services/legalDocuments';

export const ProfileSettingsLegalSection = () => {
  const { t } = useAppTranslation('common');

  return (
    <ProfileSectionCard title={t('profile.sections.legal')}>
      <Box className="gap-3">
        <ProfileShortcutCard
          icon="📜"
          title={t('legal.termsTitle')}
          description={t('profile.termsHint')}
          onPress={() => {
            void openTermsOfUse();
          }}
          accessibilityLabel={t('legal.termsTitle')}
        />
        <ProfileShortcutCard
          icon="🔒"
          title={t('legal.privacyTitle')}
          description={t('profile.privacyHint')}
          onPress={() => {
            void openPrivacyPolicy();
          }}
          accessibilityLabel={t('legal.privacyTitle')}
        />
        <Text className="px-1 text-[12px] leading-5 text-text-tertiary" selectable>
          {t('profile.twemojiAttribution')}
        </Text>
      </Box>
    </ProfileSectionCard>
  );
};
