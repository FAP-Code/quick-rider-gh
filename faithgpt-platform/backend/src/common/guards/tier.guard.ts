import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionTier } from '@prisma/client';
import { TIER_REQUIRED_KEY } from '../decorators/tier-required.decorator';

/**
 * Tier ranking used to evaluate @TierRequired() metadata. LIFETIME and
 * MINISTRY grant access to anything PLUS/PREMIUM requires (docs/11 §2).
 */
const TIER_RANK: Record<SubscriptionTier, number> = {
  FREE: 0,
  PLUS: 1,
  PREMIUM: 2,
  MINISTRY: 2,
  LIFETIME: 2,
};

/**
 * Enforces @TierRequired(...) metadata against `request.user.tier` (set by
 * JwtStrategy from the access token's `tier` claim). Routes without
 * @TierRequired() metadata are allowed for any authenticated user.
 * Throws 403 { code: 'TIER_REQUIRED' } per api/openapi.yaml `TierRequired`
 * response.
 */
@Injectable()
export class TierGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredTier = this.reflector.getAllAndOverride<SubscriptionTier | undefined>(TIER_REQUIRED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredTier) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userTier = (request.user?.tier ?? 'FREE') as SubscriptionTier;

    if (TIER_RANK[userTier] < TIER_RANK[requiredTier]) {
      throw new ForbiddenException({
        code: 'TIER_REQUIRED',
        message: `This feature requires the ${requiredTier} subscription tier or higher.`,
      });
    }

    return true;
  }
}
