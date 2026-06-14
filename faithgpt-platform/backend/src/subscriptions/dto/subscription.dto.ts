import { ApiProperty } from '@nestjs/swagger';
import { BillingProvider, SubscriptionStatus, SubscriptionTier } from '@prisma/client';
import { IsEnum, IsIn } from 'class-validator';

export class CreateCheckoutSessionDto {
  @ApiProperty({ enum: SubscriptionTier })
  @IsEnum(SubscriptionTier)
  tier: SubscriptionTier;

  @ApiProperty({ enum: ['MONTHLY', 'ANNUAL'] })
  @IsIn(['MONTHLY', 'ANNUAL'])
  billingCycle: 'MONTHLY' | 'ANNUAL';
}

export class WebhookProviderParamsDto {
  @ApiProperty({ enum: ['stripe', 'apple', 'google'] })
  @IsIn(['stripe', 'apple', 'google'])
  provider: 'stripe' | 'apple' | 'google';
}

export class EntitlementsDto {
  @ApiProperty({ enum: SubscriptionTier })
  tier: SubscriptionTier;

  @ApiProperty({ additionalProperties: true })
  quotas: Record<string, unknown>;

  @ApiProperty({ additionalProperties: true })
  usageRemaining: Record<string, unknown>;
}

export class SubscriptionDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ nullable: true })
  userId: string | null;

  @ApiProperty({ nullable: true })
  organizationId: string | null;

  @ApiProperty({ enum: SubscriptionTier })
  tier: SubscriptionTier;

  @ApiProperty({ enum: SubscriptionStatus })
  status: SubscriptionStatus;

  @ApiProperty({ enum: BillingProvider })
  provider: BillingProvider;

  @ApiProperty()
  seats: number;

  @ApiProperty({ nullable: true })
  currentPeriodStart: Date | null;

  @ApiProperty({ nullable: true })
  currentPeriodEnd: Date | null;

  @ApiProperty()
  cancelAtPeriodEnd: boolean;

  @ApiProperty({ nullable: true })
  trialEndsAt: Date | null;
}

export class InvoiceDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  subscriptionId: string;

  @ApiProperty()
  amountCents: number;

  @ApiProperty({ example: 'USD' })
  currency: string;

  @ApiProperty({ enum: ['paid', 'open', 'void', 'uncollectible'] })
  status: string;

  @ApiProperty({ nullable: true })
  providerInvoiceId: string | null;

  @ApiProperty()
  issuedAt: Date;
}
