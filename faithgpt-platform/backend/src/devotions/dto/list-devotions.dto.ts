import { ApiPropertyOptional } from '@nestjs/swagger';
import { DevotionType } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { CursorPaginationDto } from '../../common/dto/pagination.dto';

export class ListDevotionsQueryDto extends CursorPaginationDto {
  @ApiPropertyOptional({ enum: DevotionType })
  @IsOptional()
  @IsEnum(DevotionType)
  type?: DevotionType;
}
