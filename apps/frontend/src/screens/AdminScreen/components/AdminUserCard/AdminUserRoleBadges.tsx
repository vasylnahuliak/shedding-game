import type { AdminUser } from '@shedding-game/shared';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { useAppTranslation } from '@/i18n';
import { badgeBaseClassNames, badgeTextToneClassNames, badgeToneClassNames } from '@/theme';

type AdminUserRoleBadgesProps = {
  roles: AdminUser['roles'];
};

const getRoleBadgeToneClassName = (role: AdminUser['roles'][number]) => {
  if (role === 'super_admin') {
    return badgeToneClassNames.action;
  }

  if (role === 'admin') {
    return badgeToneClassNames.accent;
  }

  return badgeToneClassNames.strongDefault;
};

const getRoleBadgeTextToneClassName = (role: AdminUser['roles'][number]) => {
  if (role === 'super_admin') {
    return badgeTextToneClassNames.action;
  }

  if (role === 'admin') {
    return badgeTextToneClassNames.accent;
  }

  return badgeTextToneClassNames.neutral;
};

export const AdminUserRoleBadges = function AdminUserRoleBadges({
  roles,
}: AdminUserRoleBadgesProps) {
  const { t } = useAppTranslation('admin');

  return (
    <Box className="flex-row flex-wrap gap-2">
      {roles.map((role) => (
        <Box
          key={role}
          className={mergeClassNames(
            badgeBaseClassNames.pillLabel,
            getRoleBadgeToneClassName(role)
          )}
        >
          <Text
            className={mergeClassNames(
              'text-[12px] font-bold',
              getRoleBadgeTextToneClassName(role)
            )}
          >
            {t(`usersCard.roles.${role}`)}
          </Text>
        </Box>
      ))}
    </Box>
  );
};
