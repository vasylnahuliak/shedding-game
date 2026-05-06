import { useRouter } from 'expo-router';

import { ProfileSectionCard } from '@/components/ProfileSectionCard';
import { ProfileShortcutCard } from '@/components/ProfileShortcutCard';
import { ScreenContainer } from '@/components/ScreenContainer';
import { StyledScrollView } from '@/components/ui/interop';
import { useAppTranslation } from '@/i18n';
import { appRoutes } from '@/navigation/appRoutes';

export const AdminScreen = () => {
  const { t } = useAppTranslation('admin');
  const router = useRouter();

  return (
    <ScreenContainer edges={['bottom']}>
      <StyledScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="gap-lg pb-xl"
      >
        <ProfileSectionCard
          title={t('home.sections.games.title')}
          hint={t('home.sections.games.hint')}
        >
          <ProfileShortcutCard
            icon="🎴"
            title={t('home.sections.games.ctaTitle')}
            description={t('home.sections.games.ctaDescription')}
            onPress={() => router.push(appRoutes.adminGames)}
            accessibilityLabel={t('home.sections.games.ctaTitle')}
          />
        </ProfileSectionCard>

        <ProfileSectionCard
          title={t('home.sections.users.title')}
          hint={t('home.sections.users.hint')}
        >
          <ProfileShortcutCard
            icon="👥"
            title={t('home.sections.users.ctaTitle')}
            description={t('home.sections.users.ctaDescription')}
            onPress={() => router.push(appRoutes.adminUsers)}
            accessibilityLabel={t('home.sections.users.ctaTitle')}
          />
        </ProfileSectionCard>

        <ProfileSectionCard
          title={t('home.sections.accountDeletionRequests.title')}
          hint={t('home.sections.accountDeletionRequests.hint')}
        >
          <ProfileShortcutCard
            icon="🗂️"
            title={t('home.sections.accountDeletionRequests.ctaTitle')}
            description={t('home.sections.accountDeletionRequests.ctaDescription')}
            onPress={() => router.push(appRoutes.adminAccountDeletionRequests)}
            accessibilityLabel={t('home.sections.accountDeletionRequests.ctaTitle')}
          />
        </ProfileSectionCard>
      </StyledScrollView>
    </ScreenContainer>
  );
};
