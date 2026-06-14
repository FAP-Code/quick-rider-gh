import { SetMetadata } from '@nestjs/common';
import { SubscriptionTier } from '@prisma/client';

export const TIER_REQUIRED_KEY = 'tierRequired';

/**
 * Marks a route/controller as requiring a minimum SubscriptionTier
 * (docs/11-subscription-system.md §2 feature-gating matrix). Enforced by
 * TierGuard against the `tier` claim on `request.user` (set by JwtStrategy).
 * Tier ordering: FREE < PLUS < PREMIUM < MINISTRY < LIFETIME — MINISTRY and
 * LIFETIME are treated as satisfying any PLUS/PREMIUM requirement.
 *
 * @example
 *   @TierRequired(SubscriptionTier.PREMIUM)
 *   @Post('generate')
 *   generate() {}
 */
export const TierRequired = (tier: SubscriptionTier) => SetMetadata(TIER_REQUIRED_KEY, tier);
