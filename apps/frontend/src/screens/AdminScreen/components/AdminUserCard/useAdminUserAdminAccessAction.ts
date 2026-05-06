import type { AdminUser } from '@shedding-game/shared';

import { userHasRole } from '@shedding-game/shared';

import { useAssignAdminUserRoleMutation, useRemoveAdminUserRoleMutation } from '@/api/admin';
import { useAlert } from '@/components/AlertProvider';
import type { ButtonVariant } from '@/components/Button';
import { useAuth } from '@/hooks/useAuthStore';
import { useAppTranslation } from '@/i18n';

type AdminAccessAction = {
  disabled: boolean;
  onPress: () => void;
  title: string;
  variant: ButtonVariant;
};

type AdminUserAdminAccessState = {
  action: AdminAccessAction | null;
  canManageAdminAccess: boolean;
};

export const useAdminUserAdminAccessAction = (user: AdminUser): AdminUserAdminAccessState => {
  const { t } = useAppTranslation(['admin', 'alerts', 'common']);
  const currentUser = useAuth((state) => state.user);
  const canManageAdminAccess = userHasRole(currentUser, 'super_admin');
  const assignAdminRole = useAssignAdminUserRoleMutation();
  const removeAdminRole = useRemoveAdminUserRoleMutation();
  const { showAlert } = useAlert();
  const hasDirectAdminRole = user.roles.includes('admin');
  const hasSuperAdminRole = user.roles.includes('super_admin');
  const adminAccessMutationPending = assignAdminRole.isPending || removeAdminRole.isPending;

  if (hasSuperAdminRole) {
    return {
      action: null,
      canManageAdminAccess,
    };
  }

  const showAdminAccessUpdateError = () => {
    showAlert(t('alerts:titles.error'), t('admin:usersCard.adminAccessUpdateFailed'));
  };

  const addAdminAccess = () => {
    assignAdminRole.mutate(
      { userId: user.id, role: 'admin' },
      { onError: showAdminAccessUpdateError }
    );
  };

  const removeAdminAccess = () => {
    showAlert(
      t('admin:usersCard.removeAdminAccessConfirmTitle'),
      t('admin:usersCard.removeAdminAccessConfirmDescription', { name: user.name }),
      [
        { text: t('common:buttons.cancel'), style: 'cancel' },
        {
          text: t('admin:usersCard.removeAdminAccess'),
          style: 'destructive',
          onPress: () =>
            removeAdminRole.mutate(
              { userId: user.id, role: 'admin' },
              { onError: showAdminAccessUpdateError }
            ),
        },
      ]
    );
  };

  if (hasDirectAdminRole) {
    return {
      canManageAdminAccess,
      action: {
        disabled: adminAccessMutationPending,
        onPress: removeAdminAccess,
        title: adminAccessMutationPending
          ? t('common:labels.loading')
          : t('admin:usersCard.removeAdminAccess'),
        variant: 'danger',
      },
    };
  }

  return {
    canManageAdminAccess,
    action: {
      disabled: adminAccessMutationPending,
      onPress: addAdminAccess,
      title: adminAccessMutationPending
        ? t('common:labels.loading')
        : t('admin:usersCard.addAdminAccess'),
      variant: 'success',
    },
  };
};
