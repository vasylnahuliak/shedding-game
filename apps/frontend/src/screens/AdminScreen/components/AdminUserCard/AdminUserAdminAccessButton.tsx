import type { AdminUser } from '@shedding-game/shared';

import { Button } from '@/components/Button';

import { useAdminUserAdminAccessAction } from './useAdminUserAdminAccessAction';

type AdminUserAdminAccessButtonProps = {
  user: AdminUser;
};

export const AdminUserAdminAccessButton = function AdminUserAdminAccessButton({
  user,
}: AdminUserAdminAccessButtonProps) {
  const { action, canManageAdminAccess } = useAdminUserAdminAccessAction(user);

  if (!canManageAdminAccess || !action) {
    return null;
  }

  return (
    <Button
      title={action.title}
      onPress={action.onPress}
      variant={action.variant}
      disabled={action.disabled}
    />
  );
};
