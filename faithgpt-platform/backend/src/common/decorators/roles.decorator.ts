import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Marks a route/controller as restricted to one or more UserRole values.
 * Enforced by RolesGuard (docs/10-authentication-system.md §5 RBAC matrix).
 *
 * @example
 *   @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
 *   @Patch(':id/role')
 *   changeRole() {}
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
