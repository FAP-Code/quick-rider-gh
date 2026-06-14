import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { GenerationStatus, ImageSourceType, ImageStyle, ModerationStatus } from '@prisma/client';

/** Body of `POST /images/generate`. */
export class GenerateImageRequestDto {
  @ApiProperty({ enum: ImageSourceType })
  @IsEnum(ImageSourceType)
  sourceType!: ImageSourceType;

  @ApiPropertyOptional({
    nullable: true,
    description: 'passageKey, storyKey, etc. (required unless sourceType=CUSTOM_PROMPT)',
  })
  @IsOptional()
  @IsString()
  sourceKey?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  devotionId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  prayerId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  sermonId?: string | null;

  @ApiProperty({ enum: ImageStyle })
  @IsEnum(ImageStyle)
  style!: ImageStyle;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  userPrompt?: string | null;
}

/** ImageGeneration (api/openapi.yaml `ImageGeneration` schema). */
export class ImageGenerationDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ImageSourceType })
  sourceType!: ImageSourceType;

  @ApiProperty()
  sourceKey!: string;

  @ApiProperty({ enum: ImageStyle })
  style!: ImageStyle;

  @ApiProperty()
  refinedPrompt!: string;

  @ApiProperty({ enum: GenerationStatus })
  status!: GenerationStatus;

  @ApiPropertyOptional({ nullable: true })
  resultUrl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  thumbnailUrl!: string | null;

  @ApiProperty()
  isWatermarked!: boolean;

  @ApiProperty({ enum: ModerationStatus })
  moderationStatus!: ModerationStatus;

  @ApiProperty()
  createdAt!: Date;

  @ApiPropertyOptional({ nullable: true })
  completedAt!: Date | null;
}
