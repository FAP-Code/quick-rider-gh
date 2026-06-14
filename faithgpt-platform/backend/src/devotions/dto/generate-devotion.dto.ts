import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DevotionDepth, DevotionType } from '@prisma/client';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

/** Mirrors `components/schemas/GenerateDevotionRequest` in api/openapi.yaml. */
export class GenerateDevotionRequestDto {
  @ApiProperty({ example: 'ROM.8.28-39' })
  @IsString()
  passageKey: string;

  @ApiPropertyOptional({ default: 'ESV' })
  @IsOptional()
  @IsString()
  versionCode?: string = 'ESV';

  @ApiProperty({ enum: DevotionType })
  @IsEnum(DevotionType)
  type: DevotionType;

  @ApiProperty({ enum: DevotionDepth })
  @IsEnum(DevotionDepth)
  depth: DevotionDepth;

  @ApiPropertyOptional({
    type: [String],
    description: 'Theme slugs selected during Theme Discovery (docs/02 §1.3)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  themes?: string[];
}
