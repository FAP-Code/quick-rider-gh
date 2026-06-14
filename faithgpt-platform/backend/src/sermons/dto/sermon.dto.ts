import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

/** Output formats for `POST /sermons/generate` (api/openapi.yaml `outputType` enum). */
export enum SermonOutputType {
  SERMON = 'SERMON',
  SABBATH_SCHOOL_LESSON = 'SABBATH_SCHOOL_LESSON',
  BIBLE_STUDY_GUIDE = 'BIBLE_STUDY_GUIDE',
  YOUTH_MESSAGE = 'YOUTH_MESSAGE',
  CHILDRENS_MESSAGE = 'CHILDRENS_MESSAGE',
  TEACHING_NOTES = 'TEACHING_NOTES',
  SLIDE_OUTLINE = 'SLIDE_OUTLINE',
}

/** Sermon (api/openapi.yaml `Sermon` schema). */
export class SermonDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  passageKey!: string;

  @ApiPropertyOptional({ nullable: true })
  audience!: string | null;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: '{title, introduction, mainPoints[], illustrations[], application, altarCall, ...}',
  })
  outline!: Record<string, unknown>;

  @ApiProperty()
  createdAt!: Date;
}

/** Body of `POST /sermons/generate`. */
export class GenerateSermonDto {
  @ApiProperty({ example: 'ROM.8.28-39' })
  @IsString()
  passageOrTopic!: string;

  @ApiPropertyOptional({ nullable: true, example: 'General Congregation' })
  @IsOptional()
  @IsString()
  audience?: string | null;

  @ApiProperty({ enum: SermonOutputType })
  @IsEnum(SermonOutputType)
  outputType!: SermonOutputType;
}
