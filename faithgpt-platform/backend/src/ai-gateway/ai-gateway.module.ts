import { Module } from '@nestjs/common';
import { AiGatewayService } from './ai-gateway.service';

/**
 * AIGatewayModule — provider-agnostic abstraction over the LLM and
 * image-generation providers (docs/08-backend-architecture.md §2.1).
 *
 * No controller: consumed internally by DevotionsModule, AIStudyModule,
 * PrayersModule, SermonsModule, and VisualStudioModule via AiGatewayService.
 * Every call writes an AIUsageLog row (tokens, cost, latency, status).
 */
@Module({
  providers: [AiGatewayService],
  exports: [AiGatewayService],
})
export class AiGatewayModule {}
