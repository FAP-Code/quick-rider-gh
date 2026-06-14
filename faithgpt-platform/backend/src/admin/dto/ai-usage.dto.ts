import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { AIFeature } from '@prisma/client';

/** Query params for `GET /admin/ai-usage`. */
export class AiUsageQueryDto {
  @ApiPropertyOptional({ enum: AIFeature })
  @IsOptional()
  @IsEnum(AIFeature)
  feature?: AIFeature;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  to?: string;
}

export class AiUsageByFeatureDto {
  @ApiProperty({ enum: AIFeature })
  feature!: AIFeature;

  @ApiProperty()
  requests!: number;

  @ApiProperty()
  costUsdMicros!: number;

  @ApiProperty()
  avgLatencyMs!: number;

  @ApiProperty()
  errorRate!: number;
}

/** AIUsageSummary (api/openapi.yaml `AIUsageSummary` schema). */
export class AiUsageSummaryDto {
  @ApiProperty()
  totalRequests!: number;

  @ApiProperty()
  totalCostUsdMicros!: number;

  @ApiProperty({ type: [AiUsageByFeatureDto] })
  byFeature!: AiUsageByFeatureDto[];
}
