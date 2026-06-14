import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { PrayerRequestVisibility } from '@prisma/client';

/** PrayerRequest (api/openapi.yaml `PrayerRequest` schema). */
export class PrayerRequestDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty()
  isAnonymous!: boolean;

  @ApiProperty()
  isAnswered!: boolean;

  @ApiPropertyOptional({ nullable: true })
  answeredNote!: string | null;

  @ApiPropertyOptional({ nullable: true })
  answeredAt!: Date | null;

  @ApiProperty({ enum: PrayerRequestVisibility })
  visibility!: PrayerRequestVisibility;

  @ApiPropertyOptional({ nullable: true })
  groupId!: string | null;

  @ApiProperty()
  createdAt!: Date;
}

/** Body of `POST /prayer-requests`. */
export class CreatePrayerRequestDto {
  @ApiProperty()
  @IsString()
  content!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @ApiPropertyOptional({ enum: PrayerRequestVisibility })
  @IsOptional()
  @IsEnum(PrayerRequestVisibility)
  visibility?: PrayerRequestVisibility;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  groupId?: string | null;
}

/** Body of `POST /prayer-requests/{id}/answer`. */
export class AnswerPrayerRequestDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  answeredNote?: string | null;
}

/** Query params for `GET /prayer-requests`. */
export class ListPrayerRequestsQueryDto {
  @ApiPropertyOptional({ enum: PrayerRequestVisibility })
  @IsOptional()
  @IsEnum(PrayerRequestVisibility)
  visibility?: PrayerRequestVisibility;

  @ApiPropertyOptional({ description: 'Opaque cuid of the last item from the previous page' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  limit?: number = 20;
}
