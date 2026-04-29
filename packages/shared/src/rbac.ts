import type { AppRole, AuthUser } from './contracts';

const ROLE_INHERITANCE: Partial<Record<AppRole, readonly AppRole[]>> = {
  super_admin: ['admin'],
};

export const getEffectiveRoles = (roles: readonly AppRole[]): Set<AppRole> => {
  const effectiveRoles = new Set<AppRole>(roles);

  for (const role of roles) {
    const inheritedRoles = ROLE_INHERITANCE[role] ?? [];

    for (const inheritedRole of inheritedRoles) {
      effectiveRoles.add(inheritedRole);
    }
  }

  return effectiveRoles;
};

export const hasRole = (roles: readonly AppRole[], role: AppRole) =>
  getEffectiveRoles(roles).has(role);

export const hasAnyRole = (roles: readonly AppRole[], requiredRoles: readonly AppRole[]) => {
  const effectiveRoles = getEffectiveRoles(roles);
  return requiredRoles.some((role) => effectiveRoles.has(role));
};

export const userHasRole = (user: Pick<AuthUser, 'roles'> | null | undefined, role: AppRole) =>
  Boolean(user && hasRole(user.roles, role));

export const userHasAnyRole = (
  user: Pick<AuthUser, 'roles'> | null | undefined,
  requiredRoles: readonly AppRole[]
) => Boolean(user && hasAnyRole(user.roles, requiredRoles));

export const canAccessAdmin = (user: Pick<AuthUser, 'roles'> | null | undefined) =>
  userHasRole(user, 'admin');
