import type { AdminUser, AppLocale } from '@shedding-game/shared';
import { useRouter } from 'expo-router';

import { resolveAppLocale } from '@shedding-game/shared';

import { Button } from '@/components/Button';
import { CardListItem } from '@/components/CardListItem';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { formatDateTime, useAppTranslation } from '@/i18n';
import { appRoutes } from '@/navigation/appRoutes';
import { badgeBaseClassNames, badgeTextToneClassNames, badgeToneClassNames } from '@/theme';

type AdminUserCardProps = {
  user: AdminUser;
};

export const AdminUserCard = function AdminUserCard({ user }: AdminUserCardProps) {
  const { t, i18n } = useAppTranslation('admin');
  const router = useRouter();
  const locale: AppLocale = resolveAppLocale(i18n.language);
  const details = [
    t('usersCard.email', { value: user.email }),
    t('usersCard.userId', { value: user.id }),
    t('usersCard.locale', { value: user.locale }),
    t('usersCard.createdAt', { value: formatDateTime(locale, user.createdAt) }),
    t('usersCard.updatedAt', { value: formatDateTime(locale, user.updatedAt) }),
  ];

  return (
    <CardListItem>
      <Box className="min-w-0 flex-1 gap-3">
        <Box className="gap-2">
          <Text
            className="text-[18px] font-extrabold text-text-primary"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {user.name}
          </Text>

          <Box className="flex-row flex-wrap gap-2">
            {user.roles.map((role) => (
              <Box
                key={role}
                className={mergeClassNames(
                  badgeBaseClassNames.pillLabel,
                  role === 'super_admin'
                    ? badgeToneClassNames.action
                    : role === 'admin'
                      ? badgeToneClassNames.accent
                      : badgeToneClassNames.strongDefault
                )}
              >
                <Text
                  className={mergeClassNames(
                    'text-[12px] font-bold',
                    role === 'super_admin'
                      ? badgeTextToneClassNames.action
                      : role === 'admin'
                        ? badgeTextToneClassNames.accent
                        : badgeTextToneClassNames.neutral
                  )}
                >
                  {t(`usersCard.roles.${role}`)}
                </Text>
              </Box>
            ))}
          </Box>
        </Box>

        <Box className="gap-1 rounded-[18px] bg-surface-card-strong px-4 py-3">
          {details.map((detail) => (
            <Text key={detail} className="text-[12px] text-text-tertiary" selectable>
              {detail}
            </Text>
          ))}
        </Box>

        <Button
          title={t('usersCard.gameHistory')}
          onPress={() => router.push(appRoutes.adminUserGames({ userId: user.id }))}
        />
      </Box>
    </CardListItem>
  );
};
