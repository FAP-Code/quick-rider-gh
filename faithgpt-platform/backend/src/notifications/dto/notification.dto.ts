import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { NotificationType } from '@prisma/client';

/** Notification (api/openapi.yaml `Notification` schema). */
export class NotificationDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: NotificationType })
  type!: NotificationType;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  body!: string;

  @ApiPropertyOptional({ nullable: true, example: 'faithgpt://devotion/clx1devotion0001' })
  deepLink!: string | null;

  @ApiPropertyOptional({ nullable: true })
  readAt!: Date | null;

  @ApiProperty()
  createdAt!: Date;
}

/**
 * NotificationPreferences (api/openapi.yaml `/notifications/preferences`):
 * a map of NotificationType -> enabled. Transactional types (e.g. SYSTEM,
 * SUBSCRIPTION) are always-on/non-editable per the spec.
 */
export class NotificationPreferencesDto {
  @ApiProperty({ example: true })
  DAILY_DEVOTION!: boolean;

  @ApiProperty({ example: true })
  STREAK_REMINDER!: boolean;

  @ApiProperty({ example: true })
  PRAYER_ANSWERED!: boolean;

  @ApiProperty({ example: true })
  GROUP_ACTIVITY!: boolean;

  @ApiProperty({ example: false })
  COMMUNITY_INTERACTION!: boolean;

  @ApiProperty({ example: true })
  SUBSCRIPTION!: boolean;

  @ApiProperty({ example: true })
  SYSTEM!: boolean;
}

/** Body of `PATCH /notifications/preferences` — a partial preferences map. */
export class UpdateNotificationPreferencesDto implements Partial<NotificationPreferencesDto> {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  DAILY_DEVOTION?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  STREAK_REMINDER?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  PRAYER_ANSWERED?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  GROUP_ACTIVITY?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  COMMUNITY_INTERACTION?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  SUBSCRIPTION?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  SYSTEM?: boolean;
}
