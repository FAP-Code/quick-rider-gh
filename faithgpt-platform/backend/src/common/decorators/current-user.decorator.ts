import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SubscriptionTier, UserRole } from '@prisma/client';

/**
 * Shape of the JWT payload attached to `request.user` by JwtStrategy.
 * Mirrors the access token claims described in docs/09-api-architecture.md §5.1:
 * `sub` (user id), `role`, `tier`, plus standard `iat`/`exp`.
 */
export interface AuthenticatedUser {
  userId: string;
  email?: string | null;
  role: UserRole;
  tier: SubscriptionTier;
}

/**
 * Extracts the authenticated user (attached by JwtAuthGuard/JwtStrategy) from
 * the request. Use in controller method signatures:
 *
 * @example
 *   @Get('me')
 *   getMe(@CurrentUser() user: AuthenticatedUser) {}
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
