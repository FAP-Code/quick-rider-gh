import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PrayerType } from '@prisma/client';

/** Prayer (api/openapi.yaml `Prayer` schema). */
export class PrayerDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: PrayerType })
  type!: PrayerType;

  @ApiPropertyOptional({ nullable: true, example: 'PSA.23.1-6' })
  passageKey!: string | null;

  @ApiProperty()
  content!: string;

  @ApiProperty()
  isFavorite!: boolean;

  @ApiProperty()
  createdAt!: Date;
}

/** Body of `POST /prayers/generate`. */
export class GeneratePrayerDto {
  @ApiProperty({ enum: PrayerType })
  @IsEnum(PrayerType)
  type!: PrayerType;

  @ApiPropertyOptional({ nullable: true, example: 'PSA.23.1-6' })
  @IsOptional()
  @IsString()
  passageKey?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'starting a new job' })
  @IsOptional()
  @IsString()
  topic?: string | null;
}
