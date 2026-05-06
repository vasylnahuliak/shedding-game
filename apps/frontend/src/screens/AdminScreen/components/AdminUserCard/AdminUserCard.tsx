import type { AdminUser } from '@shedding-game/shared';
import { useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { CardListItem } from '@/components/CardListItem';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { useAppTranslation } from '@/i18n';
import { appRoutes } from '@/navigation/appRoutes';

import { AdminUserAdminAccessButton } from './AdminUserAdminAccessButton';
import { AdminUserDetails } from './AdminUserDetails';
import { AdminUserRoleBadges } from './AdminUserRoleBadges';

type AdminUserCardProps = {
  user: AdminUser;
};

export const AdminUserCard = function AdminUserCard({ user }: AdminUserCardProps) {
  const { t } = useAppTranslation('admin');
  const router = useRouter();

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

          <AdminUserRoleBadges roles={user.roles} />
        </Box>

        <AdminUserDetails user={user} />

        <Button
          title={t('usersCard.gameHistory')}
          onPress={() => router.push(appRoutes.adminUserGames({ userId: user.id }))}
        />

        <AdminUserAdminAccessButton user={user} />
      </Box>
    </CardListItem>
  );
};
