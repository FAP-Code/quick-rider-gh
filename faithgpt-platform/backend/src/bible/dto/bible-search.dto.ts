import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CursorPaginationDto } from '../../common/dto/pagination.dto';

export class BibleSearchQueryDto extends CursorPaginationDto {
  @ApiPropertyOptional({ description: 'Full-text search query' })
  @IsString()
  q: string;

  @ApiPropertyOptional({ default: 'KJV' })
  @IsOptional()
  @IsString()
  version?: string = 'KJV';
}

export class ChapterQueryDto {
  @ApiPropertyOptional({ default: 'KJV', example: 'ESV' })
  @IsOptional()
  @IsString()
  version?: string = 'KJV';
}
