import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SubscriptionTier } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OffsetPaginationDto } from '../common/dto/pagination.dto';
import { CreateCheckoutSessionDto } from './dto/subscription.dto';

/**
 * SubscriptionsModule (docs/08-backend-architecture.md §2 / docs/11
 * Subscription System): tier state, billing provider webhooks
 * (Stripe/Apple/Google/Paystack), invoice history, feature-gating lookups
 * via an EntitlementService (docs/11 §7 — folded into this service here).
 */
@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getMine(userId: string) {
    let subscription = await this.prisma.subscription.findUnique({ where: { userId } });

    if (!subscription) {
      subscription = await this.prisma.subscription.create({
        data: { userId, tier: SubscriptionTier.FREE },
      });
    }

    return {
      ...subscription,
      entitlements: this.resolveEntitlements(subscription.tier),
    };
  }

  /**
   * Resolves {tier, quotas, usageRemaining} per docs/11 §7 EntitlementService.
   * Stub: returns static placeholder quotas — a full implementation reads
   * the feature-gating matrix (docs/11 §2) and queries AIUsageLog for
   * usageRemaining, caching results in Redis (TTL 5 min).
   */
  resolveEntitlements(tier: SubscriptionTier) {
    const quotas: Record<string, number> = {
      aiStudyQuestionsPerDay: tier === 'FREE' ? 5 : tier === 'PLUS' ? 50 : -1,
      devotionDeepPerMonth: tier === 'FREE' ? 3 : -1,
      devotionAdvancedPerMonth: tier === 'FREE' ? 0 : tier === 'PLUS' ? 5 : -1,
      prayersPerDay: tier === 'FREE' ? 5 : -1,
      imagesPerMonth: tier === 'FREE' ? 5 : tier === 'PLUS' ? 50 : -1,
      sermonsAvailable: tier === 'PREMIUM' || tier === 'MINISTRY' || tier === 'LIFETIME' ? 1 : 0,
    };

    return { tier, quotas, usageRemaining: quotas };
  }

  /**
   * Creates a Stripe Checkout session for a tier/billing-cycle change. Stub:
   * does not call the Stripe SDK.
   */
  async createCheckoutSession(_userId: string, _dto: CreateCheckoutSessionDto) {
    throw new Error('not implemented: Stripe Checkout session creation');
  }

  async listInvoices(userId: string, pagination: OffsetPaginationDto) {
    const subscription = await this.prisma.subscription.findUnique({ where: { userId } });
    if (!subscription) {
      return this.emptyPage(pagination);
    }

    const page = pagination.page ?? 1;
    const pageSize = pagination.pageSize ?? 20;

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { subscriptionId: subscription.id },
        orderBy: { issuedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.invoice.count({ where: { subscriptionId: subscription.id } }),
    ]);

    return {
      data: invoices,
      meta: {
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      },
    };
  }

  /**
   * Handles inbound billing webhooks (docs/09 §8). Stub: logs the payload —
   * a full implementation verifies the provider signature (Stripe-Signature,
   * Apple JWS, Google Pub/Sub OIDC) and updates Subscription.status/tier/
   * currentPeriodEnd accordingly.
   */
  async handleWebhook(provider: 'stripe' | 'apple' | 'google', payload: unknown): Promise<void> {
    this.logger.log(`Received ${provider} webhook (not verified/processed in this scaffold)`);
    void payload;
  }

  private emptyPage(pagination: OffsetPaginationDto) {
    const page = pagination.page ?? 1;
    const pageSize = pagination.pageSize ?? 20;
    return { data: [], meta: { pagination: { page, pageSize, total: 0, totalPages: 0 } } };
  }
}
