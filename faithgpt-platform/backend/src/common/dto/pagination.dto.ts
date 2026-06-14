import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * Cursor-based pagination query params (docs/09-api-architecture.md §4.1).
 * Used for feed/log/library-style endpoints: devotions, prayers, sermons,
 * image_generations, journal_entries, notifications, ai_usage_logs,
 * community_posts, ai_conversations, highlights, notes, bookmarks.
 */
export class CursorPaginationDto {
  @ApiPropertyOptional({ description: 'Opaque cuid of the last item from the previous page' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

/**
 * Offset-based pagination query params (docs/09-api-architecture.md §4.2).
 * Used for small, bounded reference lists: bible/versions, reading-plans,
 * growth/achievements, admin list views.
 */
export class OffsetPaginationDto {
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
