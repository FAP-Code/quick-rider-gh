import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { JournalEntryType } from '@prisma/client';

/** JournalEntry (api/openapi.yaml `JournalEntry` schema). */
export class JournalEntryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: JournalEntryType })
  type!: JournalEntryType;

  @ApiPropertyOptional({ nullable: true })
  title!: string | null;

  @ApiProperty()
  content!: string;

  @ApiProperty({ type: [String] })
  tags!: string[];

  @ApiPropertyOptional({ nullable: true })
  relatedDevotionId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  relatedPrayerId!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

/** Body of `POST /journal-entries`. */
export class CreateJournalEntryDto {
  @ApiProperty({ enum: JournalEntryType })
  @IsEnum(JournalEntryType)
  type!: JournalEntryType;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  title?: string | null;

  @ApiProperty()
  @IsString()
  content!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  relatedDevotionId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  relatedPrayerId?: string | null;
}

/** Body of `PATCH /journal-entries/{id}`. */
export class UpdateJournalEntryDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  title?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

/** Query params for `GET /journal-entries`. */
export class ListJournalEntriesQueryDto {
  @ApiPropertyOptional({ enum: JournalEntryType })
  @IsOptional()
  @IsEnum(JournalEntryType)
  type?: JournalEntryType;

  @ApiPropertyOptional({ description: 'Opaque cuid of the last item from the previous page' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  limit?: number = 20;
}
