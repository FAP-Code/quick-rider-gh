import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { OffsetPaginationDto } from '../../common/dto/pagination.dto';

export class ListReadingPlansQueryDto extends OffsetPaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;
}
