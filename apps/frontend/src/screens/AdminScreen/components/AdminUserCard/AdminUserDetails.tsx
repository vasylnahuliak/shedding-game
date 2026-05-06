import { type AdminUser, type AppLocale, resolveAppLocale } from '@shedding-game/shared';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { formatDateTime, useAppTranslation } from '@/i18n';

type AdminUserDetailsProps = {
  user: AdminUser;
};

export const AdminUserDetails = function AdminUserDetails({ user }: AdminUserDetailsProps) {
  const { t, i18n } = useAppTranslation('admin');
  const locale: AppLocale = resolveAppLocale(i18n.language);
  const details = [
    t('usersCard.email', { value: user.email }),
    t('usersCard.userId', { value: user.id }),
    t('usersCard.locale', { value: user.locale }),
    t('usersCard.createdAt', { value: formatDateTime(locale, user.createdAt) }),
    t('usersCard.updatedAt', { value: formatDateTime(locale, user.updatedAt) }),
  ];

  return (
    <Box className="gap-1 rounded-[18px] bg-surface-card-strong px-4 py-3">
      {details.map((detail) => (
        <Text key={detail} className="text-[12px] text-text-tertiary" selectable>
          {detail}
        </Text>
      ))}
    </Box>
  );
};
