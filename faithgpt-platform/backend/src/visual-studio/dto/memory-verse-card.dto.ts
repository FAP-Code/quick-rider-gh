import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ImageStyle, MemoryCardFormat } from '@prisma/client';
import { ImageGenerationDto } from './image-generation.dto';

/** Body of `POST /memory-verse-cards`. */
export class GenerateMemoryVerseCardDto {
  @ApiProperty()
  @IsString()
  verseId!: string;

  @ApiProperty({ enum: MemoryCardFormat })
  @IsEnum(MemoryCardFormat)
  format!: MemoryCardFormat;

  @ApiPropertyOptional({ enum: ImageStyle })
  @IsOptional()
  @IsEnum(ImageStyle)
  style?: ImageStyle;
}

/** MemoryVerseCard (api/openapi.yaml `MemoryVerseCard` schema). */
export class MemoryVerseCardDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  verseId!: string;

  @ApiProperty({ enum: MemoryCardFormat })
  format!: MemoryCardFormat;

  @ApiProperty({ type: ImageGenerationDto, nullable: true })
  imageGeneration!: ImageGenerationDto | null;

  @ApiProperty()
  createdAt!: Date;
}
