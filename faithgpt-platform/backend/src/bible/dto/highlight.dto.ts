import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateHighlightDto {
  @ApiProperty()
  @IsString()
  verseId: string;

  @ApiPropertyOptional({ default: 'yellow' })
  @IsOptional()
  @IsString()
  color?: string = 'yellow';
}

export class HighlightDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  verseId: string;

  @ApiProperty({ example: 'yellow' })
  color: string;

  @ApiProperty()
  createdAt: Date;
}
