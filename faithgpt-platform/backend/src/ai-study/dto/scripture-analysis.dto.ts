import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { BiblicalElementType } from '@prisma/client';

/** Body of `POST /scripture-analysis`. */
export class ScriptureAnalysisRequestDto {
  @ApiProperty({ example: 'ROM.8.28-39' })
  @IsString()
  passageKey!: string;

  @ApiPropertyOptional({ default: 'ESV' })
  @IsOptional()
  @IsString()
  versionCode?: string;
}

export class ScriptureThemeDto {
  @ApiProperty({ example: 'hope' })
  slug!: string;

  @ApiProperty({ example: 'Hope' })
  name!: string;

  @ApiProperty({ example: 0.92 })
  relevance!: number;
}

export class ScriptureElementDto {
  @ApiProperty({ enum: BiblicalElementType })
  type!: BiblicalElementType;

  @ApiPropertyOptional({ nullable: true })
  note!: string | null;
}

/** ScriptureAnalysisResult (api/openapi.yaml `ScriptureAnalysisResult` schema). */
export class ScriptureAnalysisResultDto {
  @ApiProperty({ example: 'ROM.8.28-39' })
  passageKey!: string;

  @ApiProperty({ example: 'ESV' })
  versionCode!: string;

  @ApiProperty({ type: [ScriptureThemeDto] })
  themes!: ScriptureThemeDto[];

  @ApiProperty({ type: [ScriptureElementDto] })
  elements!: ScriptureElementDto[];

  @ApiProperty({
    type: [String],
    example: ["God's Sovereign Love", 'Suffering and Glory', 'Nothing Can Separate Us'],
  })
  suggestedThemes!: string[];
}
