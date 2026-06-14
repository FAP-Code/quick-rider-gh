import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ModerationStatus } from '@prisma/client';

/** Query params for `GET /admin/moderation/images`. */
export class ModerationQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}

/** Body of `PATCH /admin/moderation/posts/{id}`. */
export class ResolvePostDto {
  @ApiProperty({ enum: ModerationStatus })
  @IsEnum(ModerationStatus)
  moderationStatus!: ModerationStatus;
}
