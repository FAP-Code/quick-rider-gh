import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { OffsetPaginationDto } from '../common/dto/pagination.dto';
import { SubscriptionsService } from './subscriptions.service';
import { CreateCheckoutSessionDto, InvoiceDto, SubscriptionDto, WebhookProviderParamsDto } from './dto/subscription.dto';

/** SubscriptionsModule (api/openapi.yaml `Subscriptions` tag). */
@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('me')
  @ApiOperation({ summary: "Get the authenticated user's (or org's) subscription, tier, and entitlements" })
  @ApiResponse({ status: 200, type: SubscriptionDto })
  getMine(@CurrentUser() user: AuthenticatedUser) {
    return this.subscriptionsService.getMine(user.userId);
  }

  @Post('checkout')
  @ApiOperation({ summary: 'Create a Stripe Checkout session (web) for a tier/billing-cycle change' })
  @ApiResponse({ status: 200, description: 'Checkout session created' })
  createCheckout(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCheckoutSessionDto) {
    return this.subscriptionsService.createCheckoutSession(user.userId, dto);
  }

  @Get('invoices')
  @ApiOperation({ summary: "List billing history for the authenticated user/org" })
  @ApiResponse({ status: 200, type: [InvoiceDto] })
  listInvoices(@CurrentUser() user: AuthenticatedUser, @Query() pagination: OffsetPaginationDto) {
    return this.subscriptionsService.listInvoices(user.userId, pagination);
  }

  @Public()
  @Post('webhooks/:provider')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Inbound billing webhook (signature-verified, not bearerAuth)' })
  @ApiResponse({ status: 200, description: 'Acknowledged' })
  async handleWebhook(
    @Param() params: WebhookProviderParamsDto,
    @Body() payload: unknown,
  ): Promise<{ received: boolean }> {
    await this.subscriptionsService.handleWebhook(params.provider, payload);
    return { received: true };
  }
}
