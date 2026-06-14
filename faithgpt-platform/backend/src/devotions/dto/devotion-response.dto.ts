import { ApiProperty } from '@nestjs/swagger';
import { DevotionDepth, DevotionType } from '@prisma/client';
import { DevotionSections } from '../../ai-gateway/types/devotion-sections';

class DevotionSectionsDto implements DevotionSections {
  @ApiProperty()
  title: string;

  @ApiProperty()
  keyScripture: string;

  @ApiProperty()
  historicalContext: string;

  @ApiProperty()
  biblicalContext: string;

  @ApiProperty()
  verseExplanation: string;

  @ApiProperty()
  theologicalInsights: string;

  @ApiProperty()
  spiritualLessons: string;

  @ApiProperty()
  lifeApplications: string;

  @ApiProperty({ type: [String] })
  reflectionQuestions: string[];

  @ApiProperty({ type: [String] })
  discussionQuestions: string[];

  @ApiProperty()
  prayer: string;

  @ApiProperty({ type: [String] })
  actionSteps: string[];

  @ApiProperty()
  memoryVerse: string;

  @ApiProperty({ type: [String] })
  relatedScriptures: string[];

  @ApiProperty()
  closingEncouragement: string;
}

/** Mirrors `components/schemas/Devotion` in api/openapi.yaml. */
export class DevotionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ example: 'ROM.8.28-39' })
  passageKey: string;

  @ApiProperty({ example: 'ESV' })
  versionCode: string;

  @ApiProperty({ enum: DevotionType })
  type: DevotionType;

  @ApiProperty({ enum: DevotionDepth })
  depth: DevotionDepth;

  @ApiProperty({ type: DevotionSectionsDto })
  sections: DevotionSections;

  @ApiProperty({ nullable: true })
  memoryVerseRef: string | null;

  @ApiProperty()
  isFavorite: boolean;

  @ApiProperty()
  isShared: boolean;

  @ApiProperty()
  createdAt: Date;
}
